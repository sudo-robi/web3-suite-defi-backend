import * as StellarSdk from "@stellar/stellar-sdk";
import { logger } from "../utils/logger.js";

export interface StellarClientConfig {
  rpcUrl: string;
  networkPassphrase: string;
}

/**
 * Wrapper around Stellar SDK for RPC communication.
 * Handles server initialization, account loading, and transaction submission.
 */
export class StellarService {
  private server: StellarSdk.SorobanRpc.Server;
  private networkPassphrase: string;

  constructor(config: StellarClientConfig) {
    this.server = new StellarSdk.SorobanRpc.Server(config.rpcUrl, {
      allowHttp: config.rpcUrl.startsWith("http"),
    });
    this.networkPassphrase = config.networkPassphrase;
  }

  getServer(): StellarSdk.SorobanRpc.Server {
    return this.server;
  }

  getNetworkPassphrase(): string {
    return this.networkPassphrase;
  }

  /**
   * Get account details from the network.
   */
  async getAccount(publicKey: string): Promise<StellarSdk.Account> {
    const account = await this.server.getAccount(publicKey);
    return account;
  }

  /**
   * Build and sign a transaction, then submit to the network.
   */
  async submitTransaction(
    transaction: StellarSdk.Transaction,
    keypair: StellarSdk.Keypair
  ): Promise<StellarSdk.SorobanRpc.Api.SorobanTransactionResponse> {
    transaction.sign(keypair);

    const response = await this.server.sendTransaction(transaction);
    logger.info({ txHash: response.hash }, "Transaction submitted");

    return this.waitForTx(response.hash);
  }

  /**
   * Simulate a transaction (read-only, no submission).
   */
  async simulateTransaction(
    transaction: StellarSdk.Transaction
  ): Promise<StellarSdk.SorobanRpc.Api.SimulateTransactionResponse> {
    return this.server.simulateTransaction(transaction);
  }

  /**
   * Get transaction status by hash.
   */
  async getTransaction(
    hash: string
  ): Promise<StellarSdk.SorobanRpc.Api.TransactionResponse> {
    return this.server.getTransaction(hash);
  }

  /**
   * Wait for a transaction to be confirmed.
   */
  private async waitForTx(
    hash: string,
    maxAttempts = 30,
    intervalMs = 2000
  ): Promise<StellarSdk.SorobanRpc.Api.SorobanTransactionResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.server.getTransaction(hash);
        if (response.status === "SUCCESS") {
          return response as StellarSdk.SorobanRpc.Api.SorobanTransactionResponse;
        }
        if (response.status === "FAILED") {
          throw new Error(`Transaction failed: ${hash}`);
        }
      } catch (e) {
        if (i === maxAttempts - 1) throw e;
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(`Transaction timeout: ${hash}`);
  }

  /**
   * Encode a u128 value as ScVal.
   */
  static encodeU128(value: string): StellarSdk.xdr.ScVal {
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

  /**
   * Encode a boolean as ScVal.
   */
  static encodeBool(value: boolean): StellarSdk.xdr.ScVal {
    return StellarSdk.xdr.ScVal.scvBool(value);
  }

  /**
   * Encode a Stellar address as ScVal.
   */
  static encodeAddress(address: string): StellarSdk.xdr.ScVal {
    const keypair = StellarSdk.Keypair.fromPublicKey(address);
    return StellarSdk.xdr.ScVal.scvAddress(
      StellarSdk.xdr.ScAddress.scAddressAccount(
        StellarSdk.xdr.AccountId.fromXDR(keypair.rawPublicKey(), "hex")
      )
    );
  }

  /**
   * Decode a u128 ScVal to a string.
   */
  static decodeU128(value: StellarSdk.xdr.ScVal | undefined): string {
    if (!value) return "0";
    const parts = value.switch().value() as any;
    const hi = BigInt(parts[0].toString());
    const lo = BigInt(parts[1].toString());
    return String((hi << 64n) | lo);
  }
}
