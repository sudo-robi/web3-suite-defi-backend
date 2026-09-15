import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { logger } from "./utils/logger.js";
import { createSwapRoutes } from "./routes/swap-routes.js";
import { createLendingRoutes } from "./routes/lending-routes.js";
import { SwapService } from "./services/swap-service.js";
import { LendingService } from "./services/lending-service.js";

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

// ─── Middleware ────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(morgan("combined", {
  stream: { write: (msg: string) => logger.info(msg.trim()) },
}));

// ─── Services ─────────────────────────────────────────────

const rpcUrl = process.env.STELLAR_RPC_URL || "https://soroban-testnet.stellar.org";
const networkPassphrase = process.env.STELLAR_PASSPHRASE || "Test SDF Network ; September 2015";

const swapService = new SwapService(
  rpcUrl,
  networkPassphrase,
  process.env.SWAP_CONTRACT_ID || ""
);

const lendingService = new LendingService(
  rpcUrl,
  networkPassphrase,
  process.env.LENDING_CONTRACT_ID || ""
);

// ─── Routes ───────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    network: process.env.STELLAR_NETWORK || "testnet",
  });
});

app.use("/api/swap", createSwapRoutes(swapService));
app.use("/api/lending", createLendingRoutes(lendingService));

// ─── Error Handling ───────────────────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message: process.env.NODE_ENV === "production"
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

app.listen(PORT, () => {
  logger.info(`🚀 DeFi Backend running on http://${HOST}:${PORT}`);
  logger.info(`📡 Network: ${process.env.STELLAR_NETWORK || "testnet"}`);
  logger.info(`🔗 RPC: ${rpcUrl}`);
});

export default app;
