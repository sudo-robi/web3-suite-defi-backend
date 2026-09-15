import { StellarContractClient } from "../contracts/stellar-client.js";
import type {
  SwapQuoteRequest,
  SwapQuoteResponse,
  SwapExecuteRequest,
  SwapExecuteResponse,
} from "../types/index.js";
import { logger } from "../utils/logger.js";

export class SwapService {
  private client: StellarContractClient;

  constructor(rpcUrl: string, networkPassphrase: string, contractId: string) {
    this.client = new StellarContractClient({
      rpcUrl,
      networkPassphrase,
      contractId,
    });
  }

  async getQuote(params: SwapQuoteRequest): Promise<SwapQuoteResponse> {
    logger.info({ params }, "Getting swap quote");

    const args = [
      this.encodeU128(params.amountIn),
      this.encodeBool(params.aToB),
    ];

    const result = await this.client.invokeView("get_swap_quote", args);

    // Decode result from ScVal
    const struct = result.switch().value() as any;
    const amountOut = this.decodeU128(struct[1].value());
    const fee = this.decodeU128(struct[2].value());
    const priceImpactPct = this.decodeU128(struct[3].value());

    return {
      amountIn: params.amountIn,
      amountOut,
      fee,
      priceImpactPct,
      route: [params.tokenIn, params.tokenOut],
    };
  }

  async executeSwap(params: SwapExecuteRequest): Promise<SwapExecuteResponse> {
    logger.info({ from: params.from }, "Executing swap");

    const args = [
      this.encodeAddress(params.from),
      this.encodeU128(params.amountIn),
      this.encodeU128(params.minAmountOut),
      this.encodeBool(params.aToB),
    ];

    const response = await this.client.invokeContract(
      "swap",
      args,
      params.from,
      params.secretKey
    );

    const amountOut = this.decodeU128(response.result?.retval);

    return {
      txHash: response.hash,
      amountIn: params.amountIn,
      amountOut,
      timestamp: Date.now(),
    };
  }

  async getPoolInfo(): Promise<{
    reserveA: string;
    reserveB: string;
    feeBps: string;
    totalShares: string;
  }> {
    const result = await this.client.invokeView("get_pool_info", []);

    const struct = result.switch().value() as any;
    return {
      reserveA: this.decodeU128(struct[2].value()),
      reserveB: this.decodeU128(struct[3].value()),
      feeBps: String(struct[4].value()),
      totalShares: this.decodeU128(struct[5].value()),
    };
  }

  // ─── Encoding Helpers ───────────────────────────────────

  private encodeU128(value: string): StellarSdk.xdr.ScVal {
    const big = BigInt(value);
    const hi = Number(big >> 64n);
    const lo = Number(big & ((1n << 64n) - 1n));
    return StellarSdk.xdr.ScVal.scvU128(
      new StellarSdk.xdr.Uint128({
        hi: StellarSdk.xdr.Uint64.fromString(String(hi)),
        lo: StellarSdk.xdr.Uint64.fromString(String(lo)),
      })
    );
  }

  private encodeBool(value: boolean): StellarSdk.xdr.ScVal {
    return value
      ? StellarSdk.xdr.ScVal.scvBool(true)
      : StellarSdk.xdr.ScVal.scvBool(false);
  }

  private encodeAddress(address: string): StellarSdk.xdr.ScVal {
    const keypair = StellarSdk.Keypair.fromPublicKey(address);
    return StellarSdk.xdr.ScVal.scvAddress(
      StellarSdk.xdr.ScAddress.scAddressAccount(
        StellarSdk.xdr.AccountId.fromXDR(keypair.rawPublicKey(), "hex")
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
