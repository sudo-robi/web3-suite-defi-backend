import { Router, Request, Response, NextFunction } from "express";
import { LendingService } from "../services/lending-service.js";
import {
  SupplyRequestSchema,
  BorrowRequestSchema,
} from "../types/index.js";
import { ZodError } from "zod";

export function createLendingRoutes(lendingService: LendingService): Router {
  const router = Router();

  /**
   * GET /api/lending/pool
   * Get lending pool information
   */
  router.get("/pool", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const poolInfo = await lendingService.getPoolInfo();
      const utilization = await lendingService.getUtilizationRate();
      const supplyApy = await lendingService.getSupplyApy();
      const borrowApy = await lendingService.getBorrowApy();

      res.json({
        ...poolInfo,
        utilizationRate: utilization,
        supplyApy,
        borrowApy,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/lending/rates
   * Get current supply and borrow rates
   */
  router.get("/rates", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [supplyApy, borrowApy, utilization] = await Promise.all([
        lendingService.getSupplyApy(),
        lendingService.getBorrowApy(),
        lendingService.getUtilizationRate(),
      ]);

      res.json({ supplyApy, borrowApy, utilization });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/lending/supply
   * Supply assets to the lending pool
   */
  router.post("/supply", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = SupplyRequestSchema.parse(req.body);
      const result = await lendingService.supply(params);
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
   * POST /api/lending/borrow
   * Borrow assets from the lending pool
   */
  router.post("/borrow", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = BorrowRequestSchema.parse(req.body);
      const result = await lendingService.borrow(params);
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
   * GET /api/lending/position/:address
   * Get user lending position
   */
  router.get("/position/:address", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address } = req.params;
      const [position, healthFactor] = await Promise.all([
        lendingService.getUserPosition(address),
        lendingService.getHealthFactor(address),
      ]);

      res.json({ ...position, healthFactor });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
