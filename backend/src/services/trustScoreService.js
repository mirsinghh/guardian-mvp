export function calculateTrustScore({ simSwap, kycMatch, numberVerified, locationVerified }) {
  let score = 100;

  if (simSwap) score -= 60;
  if (!kycMatch) score -= 30;
  if (!numberVerified) score -= 25;
  if (locationVerified === false) score -= 40;
  
  if (score < 0) score = 0;

  let status = "NORMAL";
  if (score < 50) status = "PROTECTION_MODE";
  else if (score < 75) status = "WARNING";

  return { score, status };
}