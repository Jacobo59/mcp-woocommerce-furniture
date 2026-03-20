import { env } from "../../config/env";
import { getBasicAuthHeader } from "../../shared/auth";
import { AppError } from "../../shared/errors";

const BASE_URL = `${env.WC_URL}/wp-json/wc/v3`;

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: getBasicAuthHeader(
        env.WC_CONSUMER_KEY,
        env.WC_CONSUMER_SECRET
      ),
      ...(options.headers || {}),
    },
  });

  const text = await res.text();

  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new AppError("Invalid JSON response from WooCommerce", 502, text);
  }

  if (!res.ok) {
    throw new AppError(
      data?.message || "WooCommerce API error",
      res.status,
      data
    );
  }

  return data as T;
}

export const wcClient = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
