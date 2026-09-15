# Web3 Suite — DeFi Backend API

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Issues](https://img.shields.io/github/issues/web3-suite/defi-backend)](https://github.com/web3-suite/defi-backend/issues)
[![Stars](https://img.shields.io/github/stars/web3-suite/defi-backend)](https://github.com/web3-suite/defi-backend/stargazers)
[![Node](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org)

> TypeScript REST API bridging the frontend to Stellar/Soroban DeFi smart contracts — swap quotes, liquidity management, and lending operations.

---

## Overview

The backend service acts as a middleware layer between the React frontend and on-chain Soroban contracts. It handles:

- **RPC Communication** — Manages Stellar RPC connections, transaction building, and XDR encoding/decoding
- **Request Validation** — Zod schema validation on all inputs
- **Quote Engine** — Real-time swap quotes with price impact calculations
- **Error Handling** — Structured error responses with pino logging
- **Caching Ready** — Redis integration for rate limiting and quote caching

---

## Architecture

```
┌──────────────┐     ┌─────────────────────────────────────────────┐
│   Frontend   │────▶│              Express Server                  │
│  (React/Vite)│     │                                              │
└──────────────┘     │  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
                     │  │  CORS   │  │  Helmet  │  │  Pino     │  │
                     │  │  middleware │  │  (security) │  │  (logging) │  │
                     │  └─────────┘  └──────────┘  └───────────┘  │
                     │                                              │
                     │  ┌──────────────────────────────────────┐   │
                     │  │              Routes                   │   │
                     │  │  /api/swap/*    /api/lending/*        │   │
                     │  └──────────────┬───────────────────────┘   │
                     │                 │                            │
                     │  ┌──────────────▼───────────────────────┐   │
                     │  │             Services                  │   │
                     │  │  SwapService    LendingService        │   │
                     │  └──────────────┬───────────────────────┘   │
                     │                 │                            │
                     │  ┌──────────────▼───────────────────────┐   │
                     │  │        StellarContractClient          │   │
                     │  │   (XDR encode/decode, tx submit)      │   │
                     │  └──────────────┬───────────────────────┘   │
                     └─────────────────┼───────────────────────────┘
                                       │
                              ┌────────▼────────┐
                              │  Stellar RPC    │
                              │  (Soroban)      │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │  Soroban        │
                              │  Contracts      │
                              │  (on-chain)     │
                              └─────────────────┘
```

---

## API Endpoints

### Swap Endpoints

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| `GET` | `/api/swap/quote` | Get swap quote | Query params | `SwapQuoteResponse` |
| `POST` | `/api/swap/execute` | Execute swap | `SwapExecuteRequest` | `SwapExecuteResponse` |
| `GET` | `/api/swap/pools` | Get pool info | — | `PoolInfo` |

#### `GET /api/swap/quote`

Get a swap quote without executing the transaction.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `tokenIn` | string | Yes | Address of input token |
| `tokenOut` | string | Yes | Address of output token |
| `amountIn` | string | Yes | Amount to swap (positive integer) |
| `aToB` | boolean | Yes | Swap direction (A→B or B→A) |

**Response:**

```json
{
  "amountIn": "1000000",
  "amountOut": "987654",
  "fee": "3000",
  "priceImpactPct": "10",
  "route": ["CAS3J...CCCP", "CB6CH...QAIS"]
}
```

**Error Response (400):**

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request parameters",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["amountIn"],
      "message": "Required"
    }
  ]
}
```

---

#### `POST /api/swap/execute`

Execute a swap transaction on-chain.

**Request Body:**

```json
{
  "from": "GAXI4...EXAMPLE",
  "amountIn": "1000000",
  "minAmountOut": "980000",
  "aToB": true,
  "secretKey": "SXXXX...SECRET"
}
```

**Response:**

```json
{
  "txHash": "a1b2c3d4e5f6...",
  "amountIn": "1000000",
  "amountOut": "987654",
  "timestamp": 1706000000000
}
```

---

#### `GET /api/swap/pools`

Get current pool reserves and metadata.

**Response:**

```json
{
  "reserveA": "50000000",
  "reserveB": "25000000",
  "feeBps": "30",
  "totalShares": "1000000"
}
```

---

### Lending Endpoints

| Method | Endpoint | Description | Request | Response |
|--------|----------|-------------|---------|----------|
| `GET` | `/api/lending/pools` | Get pool info + rates | — | `LendingPoolInfo` |
| `GET` | `/api/lending/rates` | Get current rates | — | `RatesResponse` |
| `POST` | `/api/lending/supply` | Supply assets | `SupplyRequest` | `SupplyResponse` |
| `POST` | `/api/lending/borrow` | Borrow assets | `BorrowRequest` | `BorrowResponse` |
| `GET` | `/api/lending/position` | Get user position | Query `address` | `UserLendingPosition` |

#### `GET /api/lending/pools`

**Response:**

```json
{
  "totalDeposits": "100000000",
  "totalBorrowed": "45000000",
  "utilizationRate": "4500",
  "supplyApy": "315",
  "borrowApy": "525",
  "reserveFactor": "500"
}
```

#### `GET /api/lending/rates`

**Response:**

```json
{
  "supplyApy": "315",
  "borrowApy": "525",
  "utilization": "4500"
}
```

#### `POST /api/lending/supply`

**Request Body:**

```json
{
  "amount": "10000000",
  "secretKey": "SXXXX...SECRET"
}
```

**Response:**

```json
{
  "shares": "10000000",
  "exchangeRate": "1000000000"
}
```

#### `POST /api/lending/borrow`

**Request Body:**

```json
{
  "amount": "5000000",
  "collateralAmount": "10000000",
  "secretKey": "SXXXX...SECRET"
}
```

**Response:**

```json
{
  "amount": "5000000",
  "healthFactor": "15000",
  "utilization": "5000"
}
```

#### `GET /api/lending/position?address=GAXI4...`

**Response:**

```json
{
  "deposited": "10000000",
  "borrowed": "5000000",
  "collateralValue": "10000000",
  "healthFactor": "15000",
  "interestEarned": "25000",
  "interestOwed": "12500"
}
```

---

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-24T12:00:00.000Z",
  "version": "0.1.0",
  "network": "testnet"
}
```

---

## Project Structure

```
backend/
├── src/
│   ├── index.ts                    # Express server entry
│   ├── config.ts                   # Environment configuration
│   ├── types/
│   │   └── index.ts                # Zod schemas + TypeScript types
│   ├── routes/
│   │   ├── swap-routes.ts          # /api/swap/* endpoints
│   │   └── lending-routes.ts       # /api/lending/* endpoints
│   ├── services/
│   │   ├── swap-service.ts         # Swap business logic
│   │   ├── lending-service.ts      # Lending business logic
│   │   └── stellar.ts              # Stellar RPC client wrapper
│   ├── contracts/
│   │   └── stellar-client.ts       # Soroban contract invocation
│   └── utils/
│       └── logger.ts               # Pino logger
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
├── CONTRIBUTING.md
└── LICENSE
```

---

## Setup Instructions

### Prerequisites

- Node.js >= 20.0.0
- npm or pnpm
- Docker & Docker Compose (optional)
- Stellar testnet account with XLM

### 1. Install Dependencies

```bash
cd backend/
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Deploy Contracts

Before running the backend, deploy the Soroban contracts and set their IDs in `.env`:

```bash
cd ../contracts/
cargo build --release
# Deploy and note the contract IDs
```

### 4. Start Development Server

```bash
npm run dev
# Server runs on http://localhost:3001
```

### 5. Docker (Optional)

```bash
# Start with Redis
npm run docker:up

# Stop
npm run docker:down
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `HOST` | No | `0.0.0.0` | Server host |
| `NODE_ENV` | No | `development` | Environment mode |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `STELLAR_NETWORK` | No | `testnet` | Stellar network |
| `STELLAR_RPC_URL` | Yes | — | Soroban RPC endpoint |
| `STELLAR_HORIZON_URL` | No | — | Horizon API endpoint |
| `STELLAR_PASSPHRASE` | Yes | — | Network passphrase |
| `SWAP_CONTRACT_ID` | Yes | — | Deployed swap contract ID |
| `LIQUIDITY_CONTRACT_ID` | Yes | — | Deployed liquidity contract ID |
| `LENDING_CONTRACT_ID` | Yes | — | Deployed lending contract ID |
| `ADMIN_SECRET_KEY` | No | — | Admin keypair secret |
| `ADMIN_PUBLIC_KEY` | No | — | Admin keypair public |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |

---

## Type Definitions

All types are defined in `src/types/index.ts` using Zod for runtime validation:

```typescript
// Swap types
SwapQuoteRequestSchema     // { tokenIn, tokenOut, amountIn, aToB }
SwapExecuteRequestSchema   // { from, amountIn, minAmountOut, aToB, secretKey }
SwapQuoteResponse          // { amountIn, amountOut, fee, priceImpactPct, route }
SwapExecuteResponse        // { txHash, amountIn, amountOut, timestamp }

// Lending types
SupplyRequestSchema        // { amount, secretKey }
BorrowRequestSchema        // { amount, collateralAmount, secretKey }
LendingPoolInfo            // { totalDeposits, totalBorrowed, utilizationRate, supplyApy, borrowApy, reserveFactor }
UserLendingPosition        // { deposited, borrowed, collateralValue, healthFactor, interestEarned, interestOwed }
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Write tests for new functionality
4. Ensure type safety: `npm run typecheck`
5. Lint: `npm run lint`
6. Format: `npm run format`
7. Submit a pull request

### Code Standards

- All routes must validate input with Zod schemas
- Use structured logging via pino
- Handle errors with typed error responses
- Never expose secret keys in logs
- Use `async/await` — no raw Promises

---

## License

MIT License — see [LICENSE](LICENSE) for details.
