export function generateExplanation({
  simSwap,
  kycMatch,
  numberVerified,
  locationVerified,
  score,
  status,
}) {
  let reasons = [];

  if (simSwap) {
    reasons.push(
      "A recent SIM swap was detected, which is a strong indicator of potential identity fraud. "
    );
  }

  if (!kycMatch) {
    reasons.push(
      "The KYC verification did not match the expected user identity."
    );
  }

  if (!numberVerified) {
    reasons.push(
      "The phone number could not be verified successfully."
    );
  }

  if (locationVerified === false) {
    reasons.push(
      "The device location verification failed. The device may not be in the expected location, indicating potential unauthorized access."
    );
  }

  if (reasons.length === 0) {
    return "All security checks passed. The user's digital identity appears safe and consistent.";
  }

  return `
Security analysis completed.

${reasons.join("\n\n")}

Final Trust Score: ${score}.
System status: ${status}.
Appropriate safeguards have been applied.
`;
}