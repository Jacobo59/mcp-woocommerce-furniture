import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  MCP_AUTH_TOKEN: z.string().min(16),
  WOOCOMMERCE_URL: z.string().url(),
  WOOCOMMERCE_CONSUMER_KEY: z.string().min(10),
  WOOCOMMERCE_CONSUMER_SECRET: z.string().min(10)
});

export const env = envSchema.parse(process.env);
