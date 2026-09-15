<div align="center">

# web3-suite-defi-backend

**TypeScript REST API for Stellar/Soroban DeFi operations**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-black.svg)](https://expressjs.com/)

</div>

---

## Overview

A production-ready REST API backend that bridges frontend applications with Soroban smart contracts on the Stellar network. Provides quote calculation, transaction execution, and position management for DeFi operations.

### What's Included

| Module | Description |
|--------|-------------|
| **Swap API** | Get swap quotes, execute swaps, pool info |
| **Lending API** | Supply, borrow, rates, user positions |
| **Contract Clients** | Type-safe Soroban RPC wrappers |
| **Validation** | Zod schema validation on all inputs |
| **Logging** | Structured JSON logging with Pino |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Client (Frontend)                             │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ HTTP / REST
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Express Server                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │  Helmet   │  │   CORS   │  │  Morgan  │  │   JSON Parser     │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│  │    Routes Layer      │  │          Validation (Zod)           │  │
│  │  ─────────────────── │  │  ───────────────────────────────── │  │
│  │  /api/swap/*         │  │  Request schemas                   │  │
│  │  /api/lending/*      │  │  Response types                    │  │
│  │  /health             │  │  Error formatting                  │  │
│  └─────────┬───────────┘  └─────────────────────────────────────┘  │
│            │                                                         │
│            ▼                                                         │
│  ┌─────────────────────┐                                            │
│  │   Services Layer     │                                            │
│  │  ─────────────────── │                                            │
│  │  SwapService         │                                            │
│  │  LendingService      │                                            │
│  │  (business logic)    │                                            │
│  └─────────┬───────────┘                                            │
│            │                                                         │
│            ▼                                                         │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐  │
│  │  Contract Clients    │  │         Utilities                    │  │
│  │  ─────────────────── │  │  ───────────────────────────────── │  │
│  │  StellarContract     │  │  Logger (Pino)                      │  │
│  │  Client               │  │  Type helpers                       │  │
│  │  (Soroban RPC)        │  │  Error handlers                     │  │
│  └─────────┬───────────┘  └─────────────────────────────────────┘  │
│            │                                                         │
└────────────┼─────────────────────────────────────────────────────────┘
             │ Soroban RPC
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Stellar / Soroban Network                        │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ Swap Contract │  │Lending Contract│  │  Liquidity Contract     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |

### Swap

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/swap/quote` | Get swap quote |
| `POST` | `/api/swap/execute` | Execute a swap |
| `GET` | `/api/swap/pool` | Get pool info |

#### `GET /api/swap/quote`

Query parameters:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `tokenIn` | `string` | Yes | Address of token to swap from |
| `tokenOut` | `string` | Yes | Address of token to swap to |
| `amountIn` | `string` | Yes | Amount to swap (in base units) |
| `aToB` | `boolean` | Yes | Swap direction (A→B or B→A) |

Response:
```json
{
  "amountIn": "1000000",
  "amountOut": "985123",
  "fee": "3000",
  "priceImpactPct": "99",
  "route": ["TokenA", "TokenB"]
}
```

#### `POST /api/swap/execute`

Body:
```json
{
  "from": "G...",
  "amountIn": "1000000",
  "minAmountOut": "980000",
  "aToB": true,
  "secretKey": "S..."
}
```

Response:
```json
{
  "txHash": "abc123...",
  "amountIn": "1000000",
  "amountOut": "985123",
  "timestamp": 1706000000000
}
```

### Lending

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/lending/pool` | Get lending pool info |
| `GET` | `/api/lending/rates` | Get supply/borrow rates |
| `POST` | `/api/lending/supply` | Supply assets |
| `POST` | `/api/lending/borrow` | Borrow assets |
| `GET` | `/api/lending/position/:address` | Get user position |

#### `GET /api/lending/rates`

Response:
```json
{
  "supplyApy": "425",
  "borrowApy": "612",
  "utilization": "7200"
}
```

#### `GET /api/lending/position/:address`

Response:
```json
{
  "deposited": "5000000",
  "borrowed": "2000000",
  "collateralValue": "3500000",
  "healthFactor": "13125",
  "interestEarned": "125000",
  "interestOwed": "45000"
}
```

---

## Getting Started

### Prerequisites

- Node.js v20+
- pnpm (recommended)
- Docker (optional)

### Local Development

```bash
# Clone
git clone https://github.com/sudo-robi/web3-suite-defi-backend.git
cd web3-suite-defi-backend

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your contract IDs and keys

# Start development server
pnpm dev
```

### Docker

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f api

# Stop
docker compose down
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `HOST` | No | `0.0.0.0` | Server host |
| `NODE_ENV` | No | `development` | Environment |
| `LOG_LEVEL` | No | `info` | Logging level |
| `STELLAR_NETWORK` | No | `testnet` | Stellar network |
| `STELLAR_RPC_URL` | Yes | — | Soroban RPC endpoint |
| `STELLAR_HORIZON_URL` | No | — | Horizon API endpoint |
| `STELLAR_PASSPHRASE` | Yes | — | Network passphrase |
| `SWAP_CONTRACT_ID` | Yes | — | Deployed swap contract ID |
| `LIQUIDITY_CONTRACT_ID` | Yes | — | Deployed liquidity contract ID |
| `LENDING_CONTRACT_ID` | Yes | — | Deployed lending contract ID |
| `ADMIN_SECRET_KEY` | Yes | — | Admin secret key |
| `ADMIN_PUBLIC_KEY` | Yes | — | Admin public key |
| `CORS_ORIGIN` | No | `http://localhost:5173` | Allowed origin |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL |

---

## Project Structure

```
web3-suite-defi-backend/
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── .gitignore
└── src/
    ├── index.ts              # Express server entry point
    ├── routes/
    │   ├── swap-routes.ts    # Swap API endpoints
    │   └── lending-routes.ts # Lending API endpoints
    ├── services/
    │   ├── swap-service.ts   # Swap business logic
    │   └── lending-service.ts# Lending business logic
    ├── contracts/
    │   └── stellar-client.ts # Soroban RPC client wrapper
    ├── types/
    │   └── index.ts          # TypeScript types and Zod schemas
    └── utils/
        └── logger.ts         # Pino logger configuration
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run unit tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm lint` | Lint source files |
| `pnpm format` | Format with Prettier |
| `pnpm typecheck` | Type-check without emitting |
| `pnpm docker:up` | Start Docker services |
| `pnpm docker:down` | Stop Docker services |

---

## Security

- **Helmet:** Security headers enabled
- **CORS:** Configurable allowed origins
- **Validation:** All inputs validated with Zod schemas
- **No Secrets in Code:** Use `.env` files (gitignored)
- **Rate Limiting:** Configurable via environment variables

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT License — see [LICENSE](LICENSE) for details.
