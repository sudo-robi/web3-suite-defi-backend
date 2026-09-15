import { z } from "zod";

// ─── Swap Types ───────────────────────────────────────────

export const SwapQuoteRequestSchema = z.object({
  tokenIn: z.string().min(1),
  tokenOut: z.string().min(1),
  amountIn: z.string().regex(/^\d+$/, "Amount must be a positive integer"),
  aToB: z.boolean(),
});

export type SwapQuoteRequest = z.infer<typeof SwapQuoteRequestSchema>;

export interface SwapQuoteResponse {
  amountIn: string;
  amountOut: string;
  fee: string;
  priceImpactPct: string;
  route: [string, string];
}

export const SwapExecuteRequestSchema = z.object({
  from: z.string().min(1),
  amountIn: z.string().regex(/^\d+$/, "Amount must be a positive integer"),
  minAmountOut: z.string().regex(/^\d+$/, "Amount must be a positive integer"),
  aToB: z.boolean(),
  secretKey: z.string().min(1),
});

export type SwapExecuteRequest = z.infer<typeof SwapExecuteRequestSchema>;

export interface SwapExecuteResponse {
  txHash: string;
  amountIn: string;
  amountOut: string;
  timestamp: number;
}

// ─── Liquidity Types ──────────────────────────────────────

export const AddLiquidityRequestSchema = z.object({
  poolId: z.number().int().positive(),
  tickLower: z.number().int(),
  tickUpper: z.number().int(),
  amountA: z.string().regex(/^\d+$/, "Amount must be a positive integer"),
  amountB: z.string().regex(/^\d+$/, "Amount must be a positive integer"),
  secretKey: z.string().min(1),
});

export type AddLiquidityRequest = z.infer<typeof AddLiquidityRequestSchema>;

export interface LiquidityPosition {
  positionId: string;
  poolId: number;
  tickLower: number;
  tickUpper: number;
  liquidity: string;
  feesOwedA: string;
  feesOwedB: string;
}

export interface PoolInfo {
  poolId: number;
  tokenA: string;
  tokenB: string;
  feeTierBps: number;
  tickSpacing: number;
  totalLiquidity: string;
  sqrtPrice: string;
}

// ─── Lending Types ────────────────────────────────────────

export const SupplyRequestSchema = z.object({
  amount: z.string().regex(/^\d+$/, "Amount must be a positive integer"),
  secretKey: z.string().min(1),
});

export type SupplyRequest = z.infer<typeof SupplyRequestSchema>;

export const BorrowRequestSchema = z.object({
  amount: z.string().regex(/^\d+$/, "Amount must be a positive integer"),
  collateralAmount: z.string().regex(/^\d+$/, "Amount must be a positive integer"),
  secretKey: z.string().min(1),
});

export type BorrowRequest = z.infer<typeof BorrowRequestSchema>;

export interface LendingPoolInfo {
  totalDeposits: string;
  totalBorrowed: string;
  utilizationRate: string;
  supplyApy: string;
  borrowApy: string;
  reserveFactor: string;
}

export interface UserLendingPosition {
  deposited: string;
  borrowed: string;
  collateralValue: string;
  healthFactor: string;
  interestEarned: string;
  interestOwed: string;
}

// ─── Common Types ─────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type NetworkType = "testnet" | "mainnet" | "standalone";
