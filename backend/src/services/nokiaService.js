import axios from "axios";
import crypto from "crypto";

// SIM SWAP

export async function checkSimSwap(phone) {
  if (process.env.USE_LIVE_NOKIA !== "true") {
    console.log("Using DEMO SIM Swap mode");
    return { recentSwap: false };
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

    return {
      recentSwap: response.data.swapped,
    };

  } catch (error) {
    console.error("SIM Swap API error:", error.response?.data || error.message);
    return { recentSwap: false };
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
    console.log("Using DEMO KYC mode");
    return { match: true };
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

    return {
      match: response.data.match ?? false,
    };

  } catch (error) {
    console.error("KYC API error:", error.response?.data || error.message);
    return { match: false };
  }
}


// NUMBER VERIFICATION

export async function checkNumberVerification(phone) {

  if (process.env.USE_LIVE_NOKIA !== "true") {
    console.log("Using DEMO Number Verification mode");
    return { verified: true };
  }

  try {
    const response = await axios.post(
      "https://network-as-code.p-eu.rapidapi.com/passthrough/camara/v1/number-verification/number-verification/v0.2/verify",
      {
        phoneNumber: phone,
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

    return {
      verified: response.data.verified ?? false,
    };

  } catch (error) {
    console.error("Number Verification API error:", error.response?.data || error.message);
    return { verified: false };
  }
}

// LOCATION RETRIEVAL - Get device location

export async function getDeviceLocation(phone) {
  if (process.env.USE_LIVE_NOKIA !== "true") {
    console.log("Using DEMO Location Retrieval mode");
    // Demo: return Barcelona coordinates
    return {
      latitude: 41.3851,
      longitude: 2.1734,
      accuracy: 50,
      timestamp: new Date().toISOString(),
      demo: true,
    };
  }

  try {
    const response = await axios.post(
      "https://network-as-code.p-eu.rapidapi.com/passthrough/camara/v1/device-location/device-location/v0.3/retrieve",
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

    return {
      latitude: response.data.latitude ?? null,
      longitude: response.data.longitude ?? null,
      accuracy: response.data.accuracy ?? null,
      timestamp: response.data.timestamp ?? null,
    };
  } catch (error) {
    console.error(
      "Location Retrieval API error:",
      error.response?.data || error.message
    );
    return {
      latitude: null,
      longitude: null,
      accuracy: null,
      timestamp: null,
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
    console.log("Using DEMO Location Verification mode");
    // Per demo: si la lat és 0, simulem frau (FALSE). Si no, TRUE.
    const isFraudDemo = latitude === 0 && longitude === 0;

    return {
      verificationResult: isFraudDemo ? "FALSE" : "TRUE", // "TRUE" | "FALSE" | "PARTIAL"
      matchRate: isFraudDemo ? 10 : 100,
      lastLocationTime: new Date().toISOString(),
      demo: true,
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
      "https://network-as-code.p-eu.rapidapi.com/passthrough/camara/v1/location-verification/location-verification/v0.3/verify",
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

    return {
      verificationResult: response.data.verificationResult ?? null,
      matchRate: response.data.matchRate ?? null,
      lastLocationTime: response.data.lastLocationTime ?? null,
    };
  } catch (error) {
    console.error(
      "Location Verification API error:",
      error.response?.data || error.message
    );
    return {
      verificationResult: null,
      matchRate: null,
      lastLocationTime: null,
      error: error.response?.data || error.message,
    };
  }
}

