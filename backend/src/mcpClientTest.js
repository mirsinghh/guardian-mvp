import {
  Client,
} from "@modelcontextprotocol/sdk/client/index.js";

import {
  StdioClientTransport,
} from "@modelcontextprotocol/sdk/client/stdio.js";

async function run() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["mcpServer.js"],
  });

  const client = new Client(
    {
      name: "guardian-mcp-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  // List tools
  const tools = await client.listTools();
  console.log("Available tools:", tools);

  // Call tool
  const result = await client.callTool({
    name: "calculate_guardian_risk",
    arguments: {
      phone: "+99999991000",
      firstName: "Federica",
      lastName: "Sanchez Arjona",
      birthDate: "1978-08-22",
    },
  });

  console.log("Tool result:", result);

  process.exit(0);
}

run();