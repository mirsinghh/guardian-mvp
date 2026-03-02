import {
  Server,
} from "@modelcontextprotocol/sdk/server/index.js";

import {
  StdioServerTransport,
} from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { checkSimSwap, checkKYC } from "./services/nokiaService.js";
import { calculateTrustScore } from "./services/trustScoreService.js";

/* ===============================
   SERVER INIT
================================ */

const server = new Server(
  {
    name: "guardian-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/* ===============================
   LIST TOOLS
================================ */

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "calculate_guardian_risk",
        description:
          "Calculates telecom fraud risk for elderly protection using SIM Swap and KYC signals.",
        inputSchema: {
          type: "object",
          properties: {
            phone: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" },
            birthDate: { type: "string" },
          },
          required: ["phone", "firstName", "lastName", "birthDate"],
        },
      },
    ],
  };
});

/* ===============================
   CALL TOOL
================================ */

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "calculate_guardian_risk") {
    const { phone, firstName, lastName, birthDate } = args;

    try {
      const sim = await checkSimSwap(phone);

      const kyc = await checkKYC(phone, {
        firstName,
        lastName,
        birthDate,
      });

      const { score, status, riskFactors } = calculateTrustScore({
        simSwap: sim.recentSwap,
        kycMatch: kyc.match,
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              simSwap: sim.recentSwap,
              kycMatch: kyc.match,
              score,
              status,
              riskFactors,
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: err.message }),
          },
        ],
      };
    }
  }

  throw new Error("Unknown tool");
});

/* ===============================
   START SERVER
================================ */

const transport = new StdioServerTransport();
await server.connect(transport);