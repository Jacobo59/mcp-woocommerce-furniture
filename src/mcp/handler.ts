import { Request, Response, NextFunction } from "express";
import { jsonRpcRequestSchema, makeJsonRpcError, makeJsonRpcResult } from "../shared/jsonrpc";
import { getToolByName, toolsRegistry } from "./tools/registry";
import { AppError, toErrorPayload } from "../shared/errors";

export async function mcpHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = jsonRpcRequestSchema.parse(req.body);

    if (parsed.method === "initialize") {
      return res.json(
        makeJsonRpcResult(parsed.id, {
          server: {
            name: "wc-mcp-server",
            version: "1.0.0"
          },
          capabilities: {
            tools: true
          }
        })
      );
    }

    if (parsed.method === "tools/list") {
      return res.json(
        makeJsonRpcResult(parsed.id, {
          tools: toolsRegistry.map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
          }))
        })
      );
    }

    if (parsed.method === "tools/call") {
      const params = (parsed.params ?? {}) as { name?: string; arguments?: unknown };
      const name = params.name;

      if (!name) {
        throw new AppError("VALIDATION_ERROR", "Tool name is required", 400);
      }

      const tool = getToolByName(name);

      if (!tool) {
        return res.json(makeJsonRpcError(parsed.id, -32601, "Tool not found", { name }));
      }

      try {
        const data = await tool.execute(params.arguments ?? {});
        return res.json(
          makeJsonRpcResult(parsed.id, {
            data,
            warnings: [],
            trace_id: crypto.randomUUID()
          })
        );
      } catch (error) {
        const payload = toErrorPayload(error);
        return res.json(
          makeJsonRpcResult(parsed.id, {
            data: null,
            warnings: [],
            trace_id: crypto.randomUUID(),
            ...payload
          })
        );
      }
    }

    return res.json(makeJsonRpcError(parsed.id, -32601, "Method not found"));
  } catch (error) {
    next(error);
  }
}
