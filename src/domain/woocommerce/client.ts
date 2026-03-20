import axios from "axios";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors";

export const wooClient = axios.create({
  baseURL: `${env.WOOCOMMERCE_URL.replace(/\/$/, "")}/wp-json/wc/v3`,
  timeout: 15000,
  auth: {
    username: env.WOOCOMMERCE_CONSUMER_KEY,
    password: env.WOOCOMMERCE_CONSUMER_SECRET
  }
});

wooClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (status === 401) {
      throw new AppError("AUTH_ERROR", "WooCommerce authentication failed", 401, data);
    }
    if (status === 403) {
      throw new AppError("FORBIDDEN", "WooCommerce access denied", 403, data);
    }
    if (status === 404) {
      throw new AppError("NOT_FOUND", "WooCommerce resource not found", 404, data);
    }
    if (status === 429) {
      throw new AppError("RATE_LIMITED", "WooCommerce rate limit reached", 429, data);
    }

    throw new AppError("UPSTREAM_ERROR", "WooCommerce request failed", 502, data);
  }
);
