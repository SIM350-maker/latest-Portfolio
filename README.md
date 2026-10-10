# Software Engineer Portfolio System

A web-based portfolio that makes a software engineer's capabilities observable, understandable, credible, and verifiable through evidence-based presentation. It consists of a **public evidence system** (GET-only, published content) and a **private management system** (authenticated, session-based).

## Status

- Requirements, domain model, architecture, and implementation design: ACCEPTED AND FROZEN (see `docs/`).
- Implementation: core system implemented and verified — 38/38 automated tests passing, ESLint clean, live boot verified.
- Progress tracking: `docs/SYSTEM-ARCHITECTURE-AND-IMPLEMENTATION-ROADMAP.md`.

## Technology

- Node.js + Express (server-rendered EJS views)
- SQLite via `better-sqlite3` (WAL mode, enforced foreign keys)
- Session auth (HTTPOnly, SameSite, 30m idle / 24h absolute), synchronizer-token CSRF, helmet security headers, rate limiting (100/min public, 10/min management)
- bcrypt credential hashing (owner credential stored as a bcrypt hash in an environment variable)
- Jest + Supertest for automated verification

## Setup

1. Install Node.js (LTS) and npm.
2. `npm install`
3. `cp .env.example .env` (Windows PowerShell: `Copy-Item .env.example .env`)
4. Fill in `.env`:
   - `SESSION_SECRET` — any random value of at least 32 characters
     (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `OWNER_BCRYPT_HASH` — bcrypt hash (≥12 rounds) of your management password
     (`node -e "const b=require('bcryptjs');console.log(b.hashSync('YOUR-PASSWORD',12))"`)
5. `npm start` → http://localhost:3000 (management at http://localhost:3000/manage)

The SQLite database is created and migrated automatically at `data/dev.db` (or `data/test.db` under `NODE_ENV=test`). Set `DB_PATH` to override.

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Start the server |
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm test` | Run the Jest test suite |
| `npm run lint` | ESLint over `src` and `tests` |

## Verification evidence

- `GET /health` returns `200 {"status":"OK","database":"up",...}` (verifies the database with a real query).
- Automated suites cover: health, authentication/session security (CSRF, rotation, no-store, cookie flags), publication-state isolation (drafts never public), referential integrity (RESTRICT→409, claim-delete cascade), input validation, and 404/405 error contracts.
- Never commit `.env`, `data/*.db*`, or any secret (see `.gitignore`).

## Documentation

All authoritative engineering documents live in `docs/` — start with `docs/ENGINEERING-CONSTITUTION.md`, `docs/03-REQUIREMENTS.md`, and the roadmap for current implementation status.
