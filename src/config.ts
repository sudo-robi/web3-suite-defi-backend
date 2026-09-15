import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  STELLAR_NETWORK: z.enum(["testnet", "mainnet", "standalone"]).default("testnet"),
  STELLAR_RPC_URL: z.string().url().default("https://soroban-testnet.stellar.org"),
  STELLAR_HORIZON_URL: z.string().url().optional(),
  STELLAR_PASSPHRASE: z
    .string()
    .default("Test SDF Network ; September 2015"),

  SWAP_CONTRACT_ID: z.string().min(1, "SWAP_CONTRACT_ID is required"),
  LIQUIDITY_CONTRACT_ID: z.string().min(1, "LIQUIDITY_CONTRACT_ID is required"),
  LENDING_CONTRACT_ID: z.string().min(1, "LENDING_CONTRACT_ID is required"),

  ADMIN_SECRET_KEY: z.string().optional(),
  ADMIN_PUBLIC_KEY: z.string().optional(),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
