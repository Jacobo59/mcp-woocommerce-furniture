type Env = {
  PORT: number;
  WC_URL: string;
  WC_CONSUMER_KEY: string;
  WC_CONSUMER_SECRET: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env: Env = {
  PORT: Number(process.env.PORT ?? 3000),
  WC_URL: requireEnv("WC_URL"),
  WC_CONSUMER_KEY: requireEnv("WC_CONSUMER_KEY"),
  WC_CONSUMER_SECRET: requireEnv("WC_CONSUMER_SECRET"),
};
