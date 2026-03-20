import { z } from "zod";

export const jsonRpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string(),
  params: z.unknown().optional()
});

export type JsonRpcRequest = z.infer<typeof jsonRpcRequestSchema>;

export function makeJsonRpcResult(id: string | number | null | undefined, result: unknown) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    result
  };
}

export function makeJsonRpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  data?: unknown
) {
  return {
    jsonrpc: "2.0",
    id: id ?? null,
    error: {
      code,
      message,
      data
    }
  };
}
