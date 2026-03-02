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
    actionType, // 👈 NUEVO: Tipo de acción sensible
  }) {
    
  try {
    // Mensajes contextuales según tipo de acción
    const actionContexts = {
      sms: "al intentar responder a un SMS sospechoso que parece ser del banco",
      transfer: "al intentar realizar una transferencia bancaria",
      password: "al intentar cambiar su contraseña o datos sensibles",
      location: "al intentar acceder desde una nueva ubicación o dispositivo",
    };

    const actionContext = actionContexts[actionType] || "al realizar una acción sensible";

    const prompt = `
      You are a telecom fraud prevention analyst specialized in protecting elderly users.

      Context: ${context}
      User Action: The user is attempting a sensitive operation - ${actionContext}

      Telecom Signals:
      - Recent SIM Swap: ${simSwap}
      - KYC Match: ${kycMatch}
      - Risk Factors: ${riskFactors?.join(", ") || "None"}
      - Trust Score: ${score}
      - Status: ${status}

      Explain clearly in Spanish (for an elderly user):
      1. What happened technically with the telecom signals.
      2. Why this is dangerous specifically for this action (${actionType || "generic"}).
      3. What action should be taken immediately.

      Keep the explanation concise, empathetic, and actionable. Use simple language.
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