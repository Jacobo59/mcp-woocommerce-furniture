export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: any;
};

export type JsonRpcSuccess = {
  jsonrpc: "2.0";
  id: string | number | null;
  result: any;
};

export type JsonRpcError = {
  jsonrpc: "2.0";
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: any;
  };
};

export function success(id: JsonRpcRequest["id"], result: any): JsonRpcSuccess {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

export function failure(
  id: JsonRpcRequest["id"],
  code: number,
  message: string,
  data?: any
): JsonRpcError {
  return {
    jsonrpc: "2.0",
    id,
    error: { code, message, data },
  };
}
