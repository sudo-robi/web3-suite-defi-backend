import * as StellarSdk from "@stellar/stellar-sdk";
import { logger } from "../utils/logger.js";

export interface ContractConfig {
  networkPassphrase: string;
  rpcUrl: string;
  contractId: string;
}

export class StellarContractClient {
  private server: StellarSdk.SorobanRpc.Server;
  private networkPassphrase: string;
  private contractId: string;

  constructor(config: ContractConfig) {
    this.server = new StellarSdk.SorobanRpc.Server(config.rpcUrl, {
      allowHttp: config.rpcUrl.startsWith("http"),
    });
    this.networkPassphrase = config.networkPassphrase;
    this.contractId = config.contractId;
  }

  async invokeContract(
    method: string,
    args: StellarSdk.xdr.ScVal[],
    sourceAccount: string,
    secretKey: string
  ): Promise<StellarSdk.SorobanRpc.Api.SorobanTransactionResponse> {
    const sourceKeypair = StellarSdk.Keypair.fromSecret(secretKey);
    const account = await this.server.getAccount(sourceKeypair.publicKey());

    const contract = new StellarSdk.Contract(this.contractId);
    const operation = contract.call(method, ...args);

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(operation)
      .setTimeout(StellarSdk.TimeoutInfinite)
      .build();

    transaction.sign(sourceKeypair);

    const response = await this.server.sendTransaction(transaction);
    logger.debug({ txHash: response.hash, method }, "Contract invocation submitted");

    // Wait for confirmation
    const result = await this.waitForTransaction(response.hash);
    return result;
  }

  async invokeView(
    method: string,
    args: StellarSdk.xdr.ScVal[]
  ): Promise<StellarSdk.xdr.ScVal> {
    const contract = new StellarSdk.Contract(this.contractId);

    const result = await this.server.simulateTransaction(
      new StellarSdk.TransactionBuilder(
        new StellarSdk.Account(StellarSdk.Keypair.random().publicKey(), "0"),
        {
          fee: "0",
          networkPassphrase: this.networkPassphrase,
        }
      )
        .addOperation(contract.call(method, ...args))
        .setTimeout(StellarSdk.TimeoutInfinite)
        .build()
    );

    if (!result.result) {
      throw new Error(`Simulation failed for ${method}`);
    }

    return result.result.retval;
  }

  private async waitForTransaction(
    hash: string,
    maxAttempts = 30,
    intervalMs = 2000
  ): Promise<StellarSdk.SorobanRpc.Api.SorobanTransactionResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.server.getTransaction(hash);
        if (response.status === "SUCCESS") {
          return response as StellarSdk.SorobanRpc.Api.SorobanTransactionResponse;
        }
        if (response.status === "FAILED") {
          throw new Error(`Transaction failed: ${hash}`);
        }
      } catch (e) {
        if (attempt === maxAttempts - 1) throw e;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error(`Transaction timeout: ${hash}`);
  }

  getContractId(): string {
    return this.contractId;
  }
}
