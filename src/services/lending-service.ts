import { StellarContractClient } from "../contracts/stellar-client.js";
import type {
  SupplyRequest,
  BorrowRequest,
  LendingPoolInfo,
  UserLendingPosition,
} from "../types/index.js";
import { logger } from "../utils/logger.js";

export class LendingService {
  private client: StellarContractClient;

  constructor(rpcUrl: string, networkPassphrase: string, contractId: string) {
    this.client = new StellarContractClient({
      rpcUrl,
      networkPassphrase,
      contractId,
    });
  }

  async getPoolInfo(): Promise<LendingPoolInfo> {
    logger.info("Fetching lending pool info");

    const result = await this.client.invokeView("get_pool_info", []);
    const struct = result.switch().value() as any;

    return {
      totalDeposits: this.decodeU128(struct[1].value()),
      totalBorrowed: this.decodeU128(struct[2].value()),
      utilizationRate: "", // Calculated client-side
      supplyApy: "",
      borrowApy: "",
      reserveFactor: String(struct[3].value()),
    };
  }

  async getUtilizationRate(): Promise<string> {
    const result = await this.client.invokeView("get_utilization_rate", []);
    return String(result.switch().value());
  }

  async getSupplyApy(): Promise<string> {
    const result = await this.client.invokeView("get_supply_apy", []);
    return String(result.switch().value());
  }

  async getBorrowApy(): Promise<string> {
    const result = await this.client.invokeView("get_borrow_apy", []);
    return String(result.switch().value());
  }

  async supply(params: SupplyRequest): Promise<{ shares: string; exchangeRate: string }> {
    logger.info("Supplying to lending pool");

    const args = [this.encodeAddress(params.secretKey)];
    const response = await this.client.invokeContract(
      "supply",
      args,
      params.secretKey,
      params.secretKey
    );

    return {
      shares: "0", // Decode from result
      exchangeRate: "1000000000",
    };
  }

  async borrow(params: BorrowRequest): Promise<{
    amount: string;
    healthFactor: string;
    utilization: string;
  }> {
    logger.info("Borrowing from lending pool");

    const args = [
      this.encodeAddress(params.secretKey),
      this.encodeU128(params.amount),
    ];

    const response = await this.client.invokeContract(
      "borrow",
      args,
      params.secretKey,
      params.secretKey
    );

    return {
      amount: params.amount,
      healthFactor: "15000", // Decode from result
      utilization: "5000",
    };
  }

  async getUserPosition(userAddress: string): Promise<UserLendingPosition> {
    const args = [this.encodeAddress(userAddress)];
    const result = await this.client.invokeView("get_user_position", args);

    const struct = result.switch().value() as any;
    return {
      deposited: this.decodeU128(struct[0].value()),
      borrowed: this.decodeU128(struct[1].value()),
      collateralValue: this.decodeU128(struct[2].value()),
      healthFactor: "0",
      interestEarned: this.decodeU128(struct[4].value()),
      interestOwed: this.decodeU128(struct[5].value()),
    };
  }

  async getHealthFactor(userAddress: string): Promise<string> {
    const args = [this.encodeAddress(userAddress)];
    const result = await this.client.invokeView("get_health_factor", args);
    return String(result.switch().value());
  }

  // ─── Encoding Helpers ───────────────────────────────────

  private encodeU128(value: string): StellarSdk.xdr.ScVal {
    const { xdr } = await import("@stellar/stellar-sdk");
    const big = BigInt(value);
    const hi = Number(big >> 64n);
    const lo = Number(big & ((1n << 64n) - 1n));
    return xdr.ScVal.scvU128(
      new xdr.Uint128({
        hi: xdr.Uint64.fromString(String(hi)),
        lo: xdr.Uint64.fromString(String(lo)),
      })
    );
  }

  private encodeAddress(address: string): StellarSdk.xdr.ScVal {
    const { Keypair, xdr } = await import("@stellar/stellar-sdk");
    const keypair = Keypair.fromPublicKey(address);
    return xdr.ScVal.scvAddress(
      xdr.ScAddress.scAddressAccount(
        xdr.AccountId.fromXDR(keypair.rawPublicKey(), "hex")
      )
    );
  }

  private decodeU128(value: any): string {
    if (!value) return "0";
    const parts = value.switch().value() as any;
    const hi = BigInt(parts[0].toString());
    const lo = BigInt(parts[1].toString());
    return String((hi << 64n) | lo);
  }
}
