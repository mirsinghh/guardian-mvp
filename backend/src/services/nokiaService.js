import axios from "axios";
import crypto from "crypto";

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
