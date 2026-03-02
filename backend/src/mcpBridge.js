import {
  Client,
} from "@modelcontextprotocol/sdk/client/index.js";

import {
  StdioClientTransport,
} from "@modelcontextprotocol/sdk/client/stdio.js";

import path from "path";
import { fileURLToPath } from "url";

export async function runMcpTool(userData) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const serverPath = path.resolve(__dirname, "./mcpServer.js");

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  const client = new Client(
    { name: "guardian-agent", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect(transport);

  const result = await client.callTool({
    name: "calculate_guardian_risk",
    arguments: userData,
  });

  return JSON.parse(result.content[0].text);
}