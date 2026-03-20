import { createServer } from "node:http";
import { env } from "./config/env";
import { handleRpc } from "./mcp/handler";
import { failure } from "./shared/jsonrpc";

const server = createServer(async (req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "Method Not Allowed",
      })
    );
    return;
  }

  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", async () => {
    try {
      const request = JSON.parse(body);
      const response = await handleRpc(request);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(response));
    } catch (error: any) {
      const rpcError = failure(
        null,
        -32700,
        "Parse error",
        error?.message || error
      );

      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify(rpcError));
    }
  });
});

server.listen(env.PORT, () => {
  console.log(`MCP WooCommerce server listening on port ${env.PORT}`);
});
