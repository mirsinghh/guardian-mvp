import axios from "axios";
import { runMcpTool } from "../mcpBridge.js";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export async function runGuardianAgent(userInput, userData) {
  try {
    const planningPrompt = `
You are an AI agent.
If the user is asking about checking telecom fraud risk,
respond ONLY with:

CALL_TOOL calculate_guardian_risk

Otherwise respond with:
NO_TOOL

User request:
${userInput}
`;

    const planResponse = await axios.post(
      GEMINI_URL,
      {
        contents: [
          {
            parts: [{ text: planningPrompt }],
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

    const decision =
      planResponse.data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (decision.includes("CALL_TOOL")) {
      const toolResult = await runMcpTool(userData);

      const finalPrompt = `
You are a telecom fraud analyst protecting elderly users.

Tool Result:
${JSON.stringify(toolResult)}

Explain clearly the risk and what should be done.
`;

      const finalResponse = await axios.post(
        GEMINI_URL,
        {
          contents: [
            {
              parts: [{ text: finalPrompt }],
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

      return finalResponse.data.candidates[0].content.parts[0].text;
    }

    return "No telecom risk evaluation needed.";
  } catch (err) {
    console.error("Agent error:", err.response?.data || err.message);
    return "Agent failed.";
  }
}