# Web3 Suite — DeFi Backend API

> Type-safe REST API server bridging the frontend to Stellar/Soroban DeFi smart contracts with Zod validation, structured logging, and Docker deployment.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Issues](https://img.shields.io/github/issues/sudo-robi/web3-suite-defi-backend)](https://github.com/sudo-robi/web3-suite-defi-backend/issues)
[![Stars](https://img.shields.io/github/stars/sudo-robi/web3-suite-defi-backend)](https://github.com/sudo-robi/web3-suite-defi-backend/stargazers)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
  - [Health Check](#health-check)
  - [Swap Endpoints](#swap-endpoints)
  - [Lending Endpoints](#lending-endpoints)
- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Running](#running)
- [Docker](#docker)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Web3 Suite DeFi Backend** is a TypeScript REST API server that acts as the middleware between the React frontend and Soroban smart contracts deployed on the Stellar network. It handles request validation, Stellar RPC communication, transaction signing, encoding/decoding of ScVal types, and structured logging.

### Why This Exists

Direct browser-to-contract interaction is complex and error-prone. This backend provides a clean HTTP API that abstracts Stellar SDK complexity, validates inputs with Zod schemas, handles transaction submission and confirmation polling, and exposes a stable contract-independent interface to the frontend.

### Target Audience

- **Frontend developers** consuming the DeFi API
- **Backend engineers** extending the protocol
- **DevOps teams** deploying and monitoring the service
- **Protocol integrators** building on top of the DeFi primitives

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Frontend    │  │  Mobile App  │  │   Third-Party        │   │
│  │  (React/Vite) │  │              │  │   Integrators        │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                  │                     │                │
└─────────┼──────────────────┼─────────────────────┼────────────────┘
          │ HTTP             │ HTTP                │ HTTP
          ▼                  ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Express.js Server                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                    Middleware Stack                       │    │
│  │  helmet() → cors() → express.json() → morgan()          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐   │
│  │   Routes     │  │              Services                    │   │
│  │              │  │                                         │   │
│  │ /api/swap    │──│  SwapService                            │   │
│  │ /api/lending │──│  LendingService                         │   │
│  └─────────────┘  └────────────────┬────────────────────────┘   │
│                                    │                             │
│  ┌─────────────────────────────────▼────────────────────────┐   │
│  │              StellarContractClient                        │   │
│  │                                                           │   │
│  │  invokeView()  → simulateTransaction (read-only)         │   │
│  │  invokeContract() → sendTransaction + waitForTx          │   │
│  │  ScVal encoding: encodeU128, encodeBool, encodeAddress   │   │
│  │  ScVal decoding: decodeU128                              │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                    │
└────────────────────────────┼────────────────────────────────────┘
                             │ Stellar RPC
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Stellar / Soroban Network                      │
│                                                                  │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ Swap Contract │  │ Liquidity Contract│  │ Lending Contract │   │
│  └──────────────┘  └──────────────────┘  └──────────────────┘   │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  Redis (optional) — rate limiting, caching, session state        │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Request arrives** → Express middleware validates and logs
2. **Route handler** → Parses request with Zod schema
3. **Service layer** → Constructs Soroban contract invocation
4. **Contract client** → Encodes ScVal args, submits transaction to Stellar RPC
5. **Response** → Decodes ScVal result, returns JSON to client

---

## Features

1. **Zod Request Validation** — All inputs validated against strict schemas before processing
2. **Stellar RPC Integration** — Direct Soroban RPC communication via `@stellar/stellar-sdk`
3. **ScVal Type Encoding** — Automatic conversion between JSON and Stellar XDR ScVal types
4. **Transaction Confirmation Polling** — Waits for transaction success/failure with configurable timeouts
5. **Structured Logging** — Pino-based JSON logging with request context and error traces
6. **Security Headers** — Helmet middleware for HTTP security headers
7. **CORS Configuration** — Configurable cross-origin resource sharing
8. **Environment Validation** — Zod-validated `.env` with fail-fast on missing config
9. **Docker Support** — Multi-stage Dockerfile with health checks
10. **Docker Compose** — One-command setup with Redis for caching/rate limiting
11. **TypeScript Strict Mode** — Full type safety with `noUnusedLocals`, `noUnusedParameters`
12. **ESM Modules** — Modern ESNext module system with `import`/`export`
13. **Hot Reload Development** — `tsx watch` for instant rebuilds during development
14. **Separation of Concerns** — Clean route → service → contract client architecture

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Runtime | Node.js | >= 20.0.0 | JavaScript runtime |
| Language | TypeScript | 5.3.3 | Type-safe JavaScript |
| Framework | Express | 4.18.2 | HTTP server and routing |
| Validation | Zod | 3.22.4 | Request/response schema validation |
| Stellar SDK | @stellar/stellar-sdk | 12.0.0 | Soroban RPC and contract interaction |
| Logging | Pino | 8.17.2 | Fast structured JSON logger |
| Log Formatting | pino-pretty | 10.3.1 | Human-readable log output (dev) |
| HTTP Headers | Helmet | 7.1.0 | Security headers middleware |
| CORS | cors | 2.8.5 | Cross-origin configuration |
| Request Logging | Morgan | 1.10.0 | HTTP request logging |
| Environment | dotenv | 16.3.1 | Environment variable loading |
| Cache | ioredis | 5.3.2 | Redis client for caching |
| Dev Runner | tsx | 4.7.0 | TypeScript execution with watch |
| Testing | Vitest | 1.1.0 | Unit and integration testing |
| Coverage | @vitest/coverage-v8 | 1.1.0 | Code coverage reports |
| Linting | ESLint | 8.56.0 | Code quality enforcement |
| Formatting | Prettier | 3.2.2 | Code formatting |
| Container | Docker | 20-alpine | Production containerization |
| Cache Service | Redis | 7-alpine | In-memory data store |

---

## Project Structure

```
web3-suite-defi-backend/
├── .env.example                          # Environment variable template
├── .gitignore                            # Git ignores
├── CONTRIBUTING.md                       # Contribution guidelines
├── Dockerfile                            # Multi-stage production build
├── LICENSE                               # MIT License
├── README.md                             # This file
├── docker-compose.yml                    # Docker Compose with Redis
├── package.json                          # Dependencies and scripts
├── tsconfig.json                         # TypeScript configuration
│
└── src/
    ├── index.ts                          # Express app setup and server start
    ├── config.ts                         # Zod-validated environment config
    │
    ├── types/
    │   └── index.ts                      # Zod schemas and TypeScript types
    │
    ├── routes/
    │   ├── swap-routes.ts                # Swap API endpoints
    │   └── lending-routes.ts             # Lending API endpoints
    │
    ├── services/
    │   ├── swap-service.ts               # Swap business logic and contract calls
    │   ├── lending-service.ts            # Lending business logic and contract calls
    │   └── stellar.ts                    # Stellar SDK wrapper (server, signing, encoding)
    │
    ├── contracts/
    │   └── stellar-client.ts             # Generic Soroban contract invocation client
    │
    └── utils/
        └── logger.ts                     # Pino logger configuration
```

---

## API Reference

### Base URL

```
http://localhost:3001
```

All endpoints return JSON. Request bodies must have `Content-Type: application/json`.

---

### Health Check

#### `GET /health`

Returns server status, version, and network information.

**Response** `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2026-09-15T12:00:00.000Z",
  "version": "0.1.0",
  "network": "testnet"
}
```

**cURL**

```bash
curl http://localhost:3001/health
```

---

### Swap Endpoints

#### `GET /api/swap/quote`

Get a swap quote without executing. Calculates output amount, fees, and price impact.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenIn` | `string` | Yes | Address of the input token |
| `tokenOut` | `string` | Yes | Address of the output token |
| `amountIn` | `string` | Yes | Amount to swap (positive integer) |
| `aToB` | `string` | Yes | `"true"` for A→B, `"false"` for B→A |

**Response** `200 OK`

```json
{
  "amountIn": "1000",
  "amountOut": "997",
  "fee": "3",
  "priceImpactPct": "100",
  "route": [
    "CAS3J7HYLGSEL2VK4LW25QW2YMOHQYDWGD6Y6QSEZ3OZCNR6ESY5CCCP",
    "CB6CH2QSS6FNEBNSNKRMZ2NC2RYQKQ3K5VMWQV4ZVD4YKPP3KQXSQAIS"
  ]
}
```

**Error Response** `400 Bad Request`

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request parameters",
  "details": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["tokenIn"],
      "message": "Required"
    }
  ]
}
```

**cURL**

```bash
curl "http://localhost:3001/api/swap/quote?\
tokenIn=CAS3J7HYLGSEL2VK4LW25QW2YMOHQYDWGD6Y6QSEZ3OZCNR6ESY5CCCP&\
tokenOut=CB6CH2QSS6FNEBNSNKRMZ2NC2RYQKQ3K5VMWQV4ZVD4YKPP3KQXSQAIS&\
amountIn=1000&aToB=true"
```

---

#### `POST /api/swap/execute`

Execute a swap transaction on-chain. Requires a secret key for signing.

**Request Body**

```json
{
  "from": "GCKFBEIYV2V55A5...S4D5QF",
  "amountIn": "1000",
  "minAmountOut": "990",
  "aToB": true,
  "secretKey": "SCKFBEIYV2V55A5...SECRET"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | `string` | Yes | Public key of the swap sender |
| `amountIn` | `string` | Yes | Amount to swap (positive integer) |
| `minAmountOut` | `string` | Yes | Minimum acceptable output (slippage protection) |
| `aToB` | `boolean` | Yes | Swap direction |
| `secretKey` | `string` | Yes | Secret key for transaction signing |

**Response** `200 OK`

```json
{
  "txHash": "a1b2c3d4e5f6...hash",
  "amountIn": "1000",
  "amountOut": "997",
  "timestamp": 1726406400000
}
```

**cURL**

```bash
curl -X POST http://localhost:3001/api/swap/execute \
  -H "Content-Type: application/json" \
  -d '{
    "from": "GCKFBEIYV2V55A5...S4D5QF",
    "amountIn": "1000",
    "minAmountOut": "990",
    "aToB": true,
    "secretKey": "SCKFBEIYV2V55A5...SECRET"
  }'
```

---

#### `GET /api/swap/pool`

Get current swap pool information including reserves and fee tier.

**Response** `200 OK`

```json
{
  "reserveA": "100000",
  "reserveB": "200000",
  "feeBps": "30",
  "totalShares": "15000"
}
```

**cURL**

```bash
curl http://localhost:3001/api/swap/pool
```

---

### Lending Endpoints

#### `GET /api/lending/pool`

Get lending pool information including deposits, borrows, utilization, and rates.

**Response** `200 OK`

```json
{
  "totalDeposits": "100000",
  "totalBorrowed": "50000",
  "utilizationRate": "5000",
  "supplyApy": "150",
  "borrowApy": "200",
  "reserveFactor": "500"
}
```

**cURL**

```bash
curl http://localhost:3001/api/lending/pool
```

---

#### `GET /api/lending/rates`

Get current supply and borrow rates with utilization.

**Response** `200 OK`

```json
{
  "supplyApy": "150",
  "borrowApy": "200",
  "utilization": "5000"
}
```

**cURL**

```bash
curl http://localhost:3001/api/lending/rates
```

---

#### `POST /api/lending/supply`

Supply assets to the lending pool to earn interest.

**Request Body**

```json
{
  "amount": "10000",
  "secretKey": "SCKFBEIYV2V55A5...SECRET"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | `string` | Yes | Amount to supply (positive integer) |
| `secretKey` | `string` | Yes | Secret key for transaction signing |

**Response** `200 OK`

```json
{
  "shares": "10000",
  "exchangeRate": "1000000000"
}
```

**cURL**

```bash
curl -X POST http://localhost:3001/api/lending/supply \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "10000",
    "secretKey": "SCKFBEIYV2V55A5...SECRET"
  }'
```

---

#### `POST /api/lending/borrow`

Borrow assets from the lending pool against deposited collateral.

**Request Body**

```json
{
  "amount": "5000",
  "collateralAmount": "10000",
  "secretKey": "SCKFBEIYV2V55A5...SECRET"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | `string` | Yes | Amount to borrow (positive integer) |
| `collateralAmount` | `string` | Yes | Collateral to deposit (positive integer) |
| `secretKey` | `string` | Yes | Secret key for transaction signing |

**Response** `200 OK`

```json
{
  "amount": "5000",
  "healthFactor": "15000",
  "utilization": "5000"
}
```

**Error Response** `400 Bad Request`

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid request body",
  "details": [...]
}
```

**cURL**

```bash
curl -X POST http://localhost:3001/api/lending/borrow \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "5000",
    "collateralAmount": "10000",
    "secretKey": "SCKFBEIYV2V55A5...SECRET"
  }'
```

---

#### `GET /api/lending/position/:address`

Get a user's lending position and health factor.

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | `string` | Stellar public key of the user |

**Response** `200 OK`

```json
{
  "deposited": "10000",
  "borrowed": "5000",
  "collateralValue": "10000",
  "healthFactor": "16000",
  "interestEarned": "150",
  "interestOwed": "100"
}
```

**cURL**

```bash
curl http://localhost:3001/api/lending/position/GCKFBEIYV2V55A5...S4D5QF
```

---

### Error Responses

All errors follow a consistent format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable description"
}
```

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_ERROR` | Request failed schema validation |
| 404 | `NOT_FOUND` | Endpoint does not exist |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

In development mode, `INTERNAL_ERROR` responses include the error message. In production, the message is generic.

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** or **yarn**
- **Redis** (optional, for caching/rate limiting)
- **Deployed Soroban contracts** (swap, liquidity, lending)

### Installation

```bash
# Clone the repository
git clone https://github.com/sudo-robi/web3-suite-defi-backend.git
cd web3-suite-defi-backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your contract IDs and Stellar config
```

### Configuration

See [Environment Variables](#environment-variables) for the full list of configuration options.

At minimum, you need:

```env
SWAP_CONTRACT_ID=<your-deployed-swap-contract-id>
LIQUIDITY_CONTRACT_ID=<your-deployed-liquidity-contract-id>
LENDING_CONTRACT_ID=<your-deployed-lending-contract-id>
```

### Running

```bash
# Development (hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run on specific port
PORT=4000 npm start
```

The server starts at `http://localhost:3001` by default.

### Docker

```bash
# Start API + Redis
docker compose up -d

# View logs
docker compose logs -f api

# Stop services
docker compose down

# Rebuild and start
docker compose up -d --build
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

---

## Environment Variables

| Variable | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `PORT` | `number` | `3001` | No | Server port |
| `HOST` | `string` | `0.0.0.0` | No | Server host |
| `NODE_ENV` | `string` | `development` | No | Environment: `development`, `production`, `test` |
| `LOG_LEVEL` | `string` | `info` | No | Log level: `fatal`, `error`, `warn`, `info`, `debug`, `trace` |
| `STELLAR_NETWORK` | `string` | `testnet` | No | Network: `testnet`, `mainnet`, `standalone` |
| `STELLAR_RPC_URL` | `string` | `https://soroban-testnet.stellar.org` | No | Stellar Soroban RPC endpoint |
| `STELLAR_HORIZON_URL` | `string` | — | No | Stellar Horizon API URL |
| `STELLAR_PASSPHRASE` | `string` | `Test SDF Network ; September 2015` | No | Network passphrase |
| `SWAP_CONTRACT_ID` | `string` | — | **Yes** | Deployed swap contract address |
| `LIQUIDITY_CONTRACT_ID` | `string` | — | **Yes** | Deployed liquidity contract address |
| `LENDING_CONTRACT_ID` | `string` | — | **Yes** | Deployed lending contract address |
| `ADMIN_SECRET_KEY` | `string` | — | No | Admin secret key for contract operations |
| `ADMIN_PUBLIC_KEY` | `string` | — | No | Admin public key |
| `CORS_ORIGIN` | `string` | `http://localhost:5173` | No | Allowed CORS origin |
| `REDIS_URL` | `string` | `redis://localhost:6379` | No | Redis connection URL |
| `RATE_LIMIT_WINDOW_MS` | `number` | `60000` | No | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | `number` | `100` | No | Max requests per window |

---

## Deployment

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
NODE_ENV=production node dist/index.js
```

### Docker Production

The Dockerfile uses a multi-stage build:

1. **Builder stage**: Compiles TypeScript
2. **Runner stage**: Copies only compiled output + production dependencies

```bash
# Build and push to registry
docker build -t defi-backend:latest .
docker push registry.example.com/defi-backend:latest

# Deploy with Docker Compose
docker compose -f docker-compose.yml up -d
```

### Health Check

The Docker image includes a built-in health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<description>` | `feat/add-redis-cache` |
| Bug Fix | `fix/<description>` | `fix/decode-u128-overflow` |
| Refactor | `refactor/<description>` | `refactor/extract-encoding-utils` |
| Docs | `docs/<description>` | `docs/api-reference` |

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Redis caching for swap quotes
fix: handle Stellar RPC timeout gracefully
refactor: extract ScVal encoding to shared utils
docs: add API endpoint documentation
test: add integration tests for lending borrow
```

### Code Style

- **TypeScript strict mode** — No `any` types in new code
- **Zod validation** — All request/response shapes validated
- **Error handling** — All route handlers wrapped in try/catch
- **Logging** — Use `logger.info/warn/error` with structured context
- **Naming**: `camelCase` for variables/functions, `PascalCase` for types/classes
- **Imports**: Use `.js` extension for ESM compatibility
- **No secrets in code** — All secrets via environment variables

### Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Write tests for new endpoints/services
4. Ensure all checks pass: `npm test && npm run typecheck && npm run lint`
5. Submit PR with description and API examples

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with TypeScript & Stellar SDK</sub>
</p>
