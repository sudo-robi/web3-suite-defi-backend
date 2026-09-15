# Contributing to web3-suite-defi-backend

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [pnpm](https://pnpm.io/) (recommended) or npm
- [Docker](https://www.docker.com/) (optional, for Redis/Postgres)
- Git

### Getting Started

```bash
# Clone the repository
git clone https://github.com/sudo-robi/web3-suite-defi-backend.git
cd web3-suite-defi-backend

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start development server
pnpm dev
```

### Docker Setup

```bash
# Start with Docker Compose (includes Redis, Postgres)
docker compose up -d

# View logs
docker compose logs -f api
```

## Architecture

The backend follows a layered architecture:

```
Routes → Services → Contract Clients → Stellar Network
  ↓
Types (shared interfaces)
```

### Adding a New Route

1. Define request/response types in `src/types/`
2. Create a service in `src/services/` for business logic
3. Create a route handler in `src/routes/`
4. Register the route in `src/index.ts`
5. Write tests

### Adding a New Contract Client

1. Create a file in `src/contracts/`
2. Implement method wrappers for contract invocations
3. Use `stellar-sdk` for RPC communication
4. Add types for contract entry points

### Code Style

- TypeScript strict mode
- Prefer `const` over `let`
- Use async/await over raw promises
- Named exports over default exports
- Explicit return types on public functions

```bash
# Lint
pnpm lint

# Format
pnpm format

# Type check
pnpm typecheck
```

## Testing

```bash
# Unit tests
pnpm test

# Test with coverage
pnpm test:coverage

# Integration tests
pnpm test:integration

# Watch mode
pnpm test:watch
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Ensure all tests pass: `pnpm test`
5. Ensure lint passes: `pnpm lint`
6. Ensure types pass: `pnpm typecheck`
7. Submit a pull request

### Commit Messages

Use conventional commits:

- `feat: add swap quote endpoint`
- `fix: correct fee calculation`
- `docs: update API reference`
- `test: add lending rate tests`
- `refactor: extract contract client`

## Security

- Never commit `.env` files or secrets
- Validate all external inputs
- Use parameterized queries for database access
- Rate limit all public endpoints
- Report security vulnerabilities privately

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
