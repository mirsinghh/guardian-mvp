export async function checkSimSwap(phone) {
  return { recentSwap: false };
}

export async function checkKYC(phone) {
  return { match: true };
}

export async function checkNumberVerification(phone) {
  return { verified: true };
}