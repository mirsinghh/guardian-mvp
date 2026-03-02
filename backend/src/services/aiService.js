import "dotenv/config";
import axios from "axios";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function generateExplanation({
  simSwap,
  kycMatch,
  score,
  status,
  riskFactors,
  context,
}) {
  try {
    const prompt = `
You are a telecom fraud prevention analyst specialized in protecting elderly users.

Context: ${context}

Telecom Signals:
- Recent SIM Swap: ${simSwap}
- KYC Match: ${kycMatch}
- Risk Factors: ${riskFactors?.join(", ") || "None"}
- Trust Score: ${score}
- Status: ${status}

Explain clearly:
1. What happened technically.
2. Why this is dangerous for an elderly user.
3. What action should be taken immediately.

Keep the explanation concise and professional.
`;

    const response = await axios.post(
      GEMINI_URL,
      {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": process.env.GEMINI_API_KEY,
        },
      }
    );

    const text =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No explanation generated.";

    return text;

  } catch (error) {
    console.error(
      "Gemini API ERROR:",
      error.response?.data || error.message
    );
    return "AI explanation unavailable.";
  }
}