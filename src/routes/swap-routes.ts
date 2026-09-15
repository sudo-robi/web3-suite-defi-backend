import { Router, Request, Response, NextFunction } from "express";
import { SwapService } from "../services/swap-service.js";
import {
  SwapQuoteRequestSchema,
  SwapExecuteRequestSchema,
} from "../types/index.js";
import { ZodError } from "zod";

export function createSwapRoutes(swapService: SwapService): Router {
  const router = Router();

  /**
   * GET /api/swap/quote
   * Get a swap quote without executing
   */
  router.get("/quote", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = SwapQuoteRequestSchema.parse({
        tokenIn: req.query.tokenIn,
        tokenOut: req.query.tokenOut,
        amountIn: req.query.amountIn,
        aToB: req.query.aToB === "true",
      });

      const quote = await swapService.getQuote(params);
      res.json(quote);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Invalid request parameters",
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  });

  /**
   * POST /api/swap/execute
   * Execute a swap transaction
   */
  router.post("/execute", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = SwapExecuteRequestSchema.parse(req.body);
      const result = await swapService.executeSwap(params);
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  });

  /**
   * GET /api/swap/pool
   * Get current pool information
   */
  router.get("/pool", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const poolInfo = await swapService.getPoolInfo();
      res.json(poolInfo);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
