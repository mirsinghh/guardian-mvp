const WEIGHTS = {
  SIM_SWAP: 60,
  KYC_MISMATCH: 30,
};

export function calculateTrustScore({ simSwap, kycMatch }) {
  let score = 100;
  const riskFactors = [];

  if (simSwap === true) {
    score -= WEIGHTS.SIM_SWAP;
    riskFactors.push("RECENT_SIM_SWAP");
  }

  if (kycMatch === false) {
    score -= WEIGHTS.KYC_MISMATCH;
    riskFactors.push("KYC_MISMATCH");
  }

  if (score < 0) score = 0;

  let status = "NORMAL";
  if (score < 50) status = "PROTECTION_MODE";
  else if (score < 75) status = "WARNING";

  const actionAllowed = status !== "PROTECTION_MODE";

  return { score, status, riskFactors, actionAllowed };
}