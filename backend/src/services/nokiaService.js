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

