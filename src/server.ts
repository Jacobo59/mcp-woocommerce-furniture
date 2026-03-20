import express, { Request, Response, NextFunction } from "express";
import { env } from "./config/env";
import { requireBearerToken } from "./shared/auth";
import { mcpHandler } from "./mcp/handler";
import { AppError, toErrorPayload } from "./shared/errors";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "wc-mcp-server" });
});

app.post("/mcp", requireBearerToken, mcpHandler);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.status).json(toErrorPayload(error));
  }

  return res.status(500).json(toErrorPayload(error));
});

app.listen(env.PORT, () => {
  console.log(`MCP server listening on port ${env.PORT}`);
});
