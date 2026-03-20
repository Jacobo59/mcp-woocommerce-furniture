import { JsonRpcRequest, success, failure } from "../shared/jsonrpc";
import { toolsRegistry } from "./tools/registry";

export async function handleRpc(request: JsonRpcRequest) {
  const { id, method, params } = request;

  const tool = toolsRegistry[method];

  if (!tool) {
    return failure(id, -32601, `Method not found: ${method}`);
  }

  try {
    const result = await tool(params);
    return success(id, result);
  } catch (error: any) {
    return failure(
      id,
      -32000,
      error?.message || "Internal error",
      error
    );
  }
}
