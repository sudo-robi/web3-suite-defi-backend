import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config.js";
import { logger } from "./utils/logger.js";
import { createSwapRoutes } from "./routes/swap-routes.js";
import { createLendingRoutes } from "./routes/lending-routes.js";
import { SwapService } from "./services/swap-service.js";
import { LendingService } from "./services/lending-service.js";

const app = express();

// ─── Middleware ────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(morgan("combined", {
  stream: { write: (msg: string) => logger.info(msg.trim()) },
}));

// ─── Services ─────────────────────────────────────────────

const swapService = new SwapService(
  env.STELLAR_RPC_URL,
  env.STELLAR_PASSPHRASE,
  env.SWAP_CONTRACT_ID
);

const lendingService = new LendingService(
  env.STELLAR_RPC_URL,
  env.STELLAR_PASSPHRASE,
  env.LENDING_CONTRACT_ID
);

// ─── Routes ───────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    network: env.STELLAR_NETWORK,
  });
});

app.use("/api/swap", createSwapRoutes(swapService));
app.use("/api/lending", createLendingRoutes(lendingService));

// ─── Error Handling ───────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    code: "NOT_FOUND",
    message: "The requested endpoint does not exist",
  });
});

// ─── Start Server ─────────────────────────────────────────

app.listen(env.PORT, () => {
  logger.info(`🚀 DeFi Backend running on http://${env.HOST}:${env.PORT}`);
  logger.info(`📡 Network: ${env.STELLAR_NETWORK}`);
  logger.info(`🔗 RPC: ${env.STELLAR_RPC_URL}`);
});

export default app;
