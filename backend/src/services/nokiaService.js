import axios from "axios";
import crypto from "crypto";


// async function getAccessToken() {
//   try {
//     const response = await axios.get(
//       "https://network-as-code.p-eu.rapidapi.com/oauth2/v1/auth/clientcredentials",
//       {
//         headers: {
//           "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
//           "X-RapidAPI-Host": "network-as-code.nokia.rapidapi.com",
//         },
//         params: {
//           client_id: process.env.NOKIA_CLIENT_ID,
//           client_secret: process.env.NOKIA_CLIENT_SECRET,
//         },
//       }
//     );

//     console.log("[TOKEN SUCCESS]", response.data);
//     return response.data.access_token;

//   } catch (error) {
//     console.error("[TOKEN ERROR]", error.response?.data || error.message);
//     throw error;
//   }
// }

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {

  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await axios.get(
    "https://network-as-code.p-eu.rapidapi.com/oauth2/v1/auth/clientcredentials",
    {
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "network-as-code.nokia.rapidapi.com",
      },
      params: {
        client_id: process.env.NOKIA_CLIENT_ID,
        client_secret: process.env.NOKIA_CLIENT_SECRET,
      },
    }
  );

  cachedToken = response.data.access_token;
  tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;

  return cachedToken;
}

// SIM SWAP

export async function checkSimSwap(phone) {
  if (process.env.USE_LIVE_NOKIA !== "true") {
    console.log("[DEMO MODE] SIM Swap");
    return { recentSwap: false, isDemo: true };
  }

  try {
    const response = await axios.post(
      "https://network-as-code.p-eu.rapidapi.com/passthrough/camara/v1/sim-swap/sim-swap/v0/check",
      {
        phoneNumber: phone,
        maxAge: 240,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
        },
      }
    );

    console.log("[LIVE API] SIM Swap SUCCESS:", response.data);
    return {
      recentSwap: response.data.swapped,
      isDemo: false,
      apiSuccess: true,
    };

  } catch (error) {
    console.error("[LIVE API] SIM Swap ERROR:", error.response?.data || error.message);
    return { recentSwap: false, isDemo: false, apiSuccess: false, error: error.message };
  }
}

export async function getLatestSimChange(phone) {
  if (process.env.USE_LIVE_NOKIA !== "true") {
    return { latestSimChange: null };
  }

  try {
    const response = await axios.post(
      "https://network-as-code.p-eu.rapidapi.com/passthrough/camara/v1/sim-swap/sim-swap/v0/latest",
      {
        phoneNumber: phone,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
        },
      }
    );

    return {
      latestSimChange: response.data.latestSimChange,
    };

  } catch (error) {
    console.error("Latest SIM change error:", error.response?.data || error.message);
    return { latestSimChange: null };
  }
}

// KYC

export async function checkKYC(phone, userData) {

  if (process.env.USE_LIVE_NOKIA !== "true") {
    console.log("[DEMO MODE] KYC Match");
    return { match: true, isDemo: true };
  }

  try {
    const response = await axios.post(
      "https://network-as-code.p-eu.rapidapi.com/passthrough/camara/v1/kyc-match/kyc-match/v0.3/match",
      {
        phoneNumber: phone,
        givenName: userData.firstName,
        familyName: userData.lastName,
        birthdate: userData.birthDate,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
          "X-Correlator": crypto.randomUUID(),
        },
      }
    );

    console.log("[LIVE API] KYC Match SUCCESS:", response.data);
    
    // KYC v0.3 puede devolver campos individuales o un campo 'match' global
    const givenNameMatch = response.data.givenNameMatch === true || response.data.givenNameMatch === "true";
    const familyNameMatch = response.data.familyNameMatch === true || response.data.familyNameMatch === "true";
    const birthdateMatch = response.data.birthdateMatch === true || response.data.birthdateMatch === "true";
    
    // Si hay campo 'match' global, usarlo. Si no, calcular basado en campos individuales
    let overallMatch;
    if (response.data.match !== undefined) {
      overallMatch = response.data.match === true || response.data.match === "true";
    } else {
      // Match global = todos los campos enviados coinciden
      overallMatch = givenNameMatch && familyNameMatch && birthdateMatch;
    }
    
    console.log("[KYC DETAILS] givenName:", givenNameMatch, "| familyName:", familyNameMatch, "| birthdate:", birthdateMatch, "| OVERALL:", overallMatch);
    
    return {
      match: overallMatch,
      givenNameMatch,
      familyNameMatch,
      birthdateMatch,
      isDemo: false,
      apiSuccess: true,
    };

  } catch (error) {
    console.error("[LIVE API] KYC Match ERROR:", error.response?.data || error.message);
    return { match: false, isDemo: false, apiSuccess: false, error: error.message };
  }
}


// NUMBER VERIFICATION

export async function checkNumberVerification(phone) {

  if (process.env.USE_LIVE_NOKIA !== "true") {
    console.log("[DEMO MODE] Number Verification");
    return { verified: true, isDemo: true };
  }

  try {
    const accessToken = await getAccessToken();

    const response = await axios.post(
      "https://network-as-code.p-eu.rapidapi.com/passthrough/camara/v1/number-verification/number-verification/v0/verify",
      {
        phoneNumber: phone,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "network-as-code.nokia.rapidapi.com",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log("[LIVE API] Number Verification SUCCESS:", response.data);

    return {
      verified: response.data.devicePhoneNumberVerified ?? false,
      isDemo: false,
      apiSuccess: true,
    };

  } catch (error) {
    console.error("[LIVE API] Number Verification ERROR:", error.response?.data || error.message);

    return {
      verified: false,
      isDemo: false,
      apiSuccess: false,
      error: error.response?.data || error.message,
    };
  }
}

// LOCATION RETRIEVAL - Get device location

export async function getDeviceLocation(phone) {
  if (process.env.USE_LIVE_NOKIA !== "true") {
    console.log("[DEMO MODE] Location Retrieval");
    // Demo: return Barcelona coordinates
    return {
      latitude: 41.3851,
      longitude: 2.1734,
      accuracy: 50,
      timestamp: new Date().toISOString(),
      isDemo: true,
    };
  }

  try {
    const response = await axios.post(
      "https://network-as-code.p-eu.rapidapi.com/passthrough/camara/v1/device-location/device-location/v0/retrieve",
      {
        device: { phoneNumber: phone },
        maxAge: 60,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
          "X-Correlator": crypto.randomUUID(),
        },
      }
    );

    console.log("[LIVE API] Location Retrieval SUCCESS:", response.data);
    return {
      latitude: response.data.latitude ?? null,
      longitude: response.data.longitude ?? null,
      accuracy: response.data.accuracy ?? null,
      timestamp: response.data.timestamp ?? null,
      isDemo: false,
      apiSuccess: true,
    };
  } catch (error) {
    console.error(
      "[LIVE API] Location Retrieval ERROR:",
      error.response?.data || error.message
    );
    return {
      latitude: null,
      longitude: null,
      accuracy: null,
      timestamp: null,
      isDemo: false,
      apiSuccess: false,
      error: error.response?.data || error.message,
    };
  }
}

// LOCATION VERIFICATION

export async function checkLocationVerification(
  phone,
  { latitude, longitude, radius = 1500, maxAge = 120 } = {}
) {
  // DEMO mode si no hi ha live
  if (process.env.USE_LIVE_NOKIA !== "true") {
    console.log("[DEMO MODE] Location Verification");
    // Per demo: si la lat és 0, simulem frau (FALSE). Si no, TRUE.
    const isFraudDemo = latitude === 0 && longitude === 0;

    return {
      verificationResult: isFraudDemo ? "FALSE" : "TRUE", // "TRUE" | "FALSE" | "PARTIAL"
      matchRate: isFraudDemo ? 10 : 100,
      lastLocationTime: new Date().toISOString(),
      isDemo: true,
    };
  }

  // Si és live però falta info, no petem: retornem null i ja
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return {
      verificationResult: null,
      matchRate: null,
      lastLocationTime: null,
      error: "Missing latitude/longitude",
    };
  }

  try {
    const response = await axios.post(
      "https://network-as-code.p-eu.rapidapi.com/passthrough/camara/v1/location-verification/location-verification/v0/verify",
      {
        device: { phoneNumber: phone },
        area: {
          areaType: "CIRCLE",
          center: { latitude, longitude },
          radius,
        },
        maxAge,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
          "X-Correlator": crypto.randomUUID(),
        },
      }
    );

    console.log("[LIVE API] Location Verification SUCCESS:", response.data);
    return {
      verificationResult: response.data.verificationResult ?? null,
      matchRate: response.data.matchRate ?? null,
      lastLocationTime: response.data.lastLocationTime ?? null,
      isDemo: false,
      apiSuccess: true,
    };
  } catch (error) {
    console.error(
      "[LIVE API] Location Verification ERROR:",
      error.response?.data || error.message
    );
    return {
      verificationResult: null,
      matchRate: null,
      lastLocationTime: null,
      isDemo: false,
      apiSuccess: false,
      error: error.response?.data || error.message,
    };
  }
}

//LOCATION RETRIEVAL
// LOCATION RETRIEVAL (CAMARA)

export async function retrieveLocation(phone, { maxAge = 120, maxSurface } = {}) {
  if (process.env.USE_LIVE_NOKIA !== "true") {
    console.log("Using DEMO Location Retrieval mode");
    // Demo simple (Barcelona). Ajusta si quieres.
    return {
      location: {
        area: {
          areaType: "CIRCLE",
          center: { latitude: 41.3874, longitude: 2.1686 },
          radius: 1500,
        },
        lastLocationTime: new Date().toISOString(),
      },
    };
  }

  // En algunos hubs esto puede ser v0, v0.5, vwip, etc.
  const apiVersion = process.env.LOCATION_RETRIEVAL_VERSION || "v0";

  try {
    const response = await axios.post(
      `https://network-as-code.p-eu.rapidapi.com/location-retrieval/${apiVersion}/retrieve`,
      {
        device: { phoneNumber: phone }, // CAMARA: E.164 con '+'
        maxAge,                          // segundos (0 = fresh), opcional
        ...(maxSurface ? { maxSurface } : {}), // m², opcional
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
          "X-Correlator": crypto.randomUUID(),
        },
      }
    );

    // Devuelve el payload tal cual (incluye area circle/polygon + lastLocationTime)
    return { location: response.data };
  } catch (error) {
    console.error(
      "Location Retrieval API error:",
      error.response?.data || error.message
    );
    return { location: null };
  }
}
