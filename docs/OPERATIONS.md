# Operations Runbook — Database (Neon PostgreSQL)

**Scope:** day-2 operations for the Neon PostgreSQL data layer (Phase 4 of `docs/POSTGRES-DATA-ARCHITECTURE.md`).
**Audience:** the owner/admin operating the portfolio system.

---

## 1. Topology

| Environment | Database | Driver activation |
|---|---|---|
| Production (Neon branch `production`) | `DATABASE_URL` in `.env` (pooled `-pooler` endpoint) | automatic (default when `DATABASE_URL` is set) |
| Local dev without config | `data/dev.db` (SQLite) | fallback |
| Tests | per-worker throwaway SQLite files, or CI Postgres service / Neon branch | `DB_DRIVER=sqlite` (forced) / `DB_DRIVER=postgres` (CI matrix) |
| Rehearsal / upgrade verification | throwaway Neon branch (`neon branches create`) | branch URL as `DATABASE_URL` |

**Rollback path:** set `DB_DRIVER=sqlite` (or unset `DATABASE_URL`) and restart — the legacy `./data` volume database still mounts in Docker (`docker-compose.yml`).

## 2. Health & verification

- `GET /health` → `{"status":"OK","database":"up","driver":"postgres"}` (503 + `database:"down"` on failure).
- Full pipeline check: `node scripts/verify-postgres.js` — connection, retry, idempotent schema apply, CRUD roundtrip (rolled back, zero residue).
- SSE live-update loop: `VERIFY_PASSWORD=<mgmt-password> node scripts/verify-sse.js` (server must be running).
- Both scripts target `TEST_POSTGRES_URL` or `DATABASE_URL`.

## 3. Backups

Neon stores point-in-time history per the plan's retention; explicit backups are cheap — prefer **branches** (copy-on-write, seconds) plus periodic **logical dumps**:

### 3.1 Branch snapshot (recommended before risky changes)
```powershell
neon branches create --project-id little-union-15338242 --name backup-2026-10-12
# restore = re-point the app at the backup branch's connection string:
neon connection-string backup-2026-10-12
```
Delete stale backups: `neon branches delete <branch-id> --force`.

### 3.2 Logical dump (portable, off-Neon)
Requires `pg_dump` (any PostgreSQL ≥ 16 client tools):
```powershell
# schema + data against the UNPOOLED endpoint (pg_dump cannot use PgBouncer)
pg_dump "$env:DATABASE_URL_UNPOOLED" --no-owner --format=custom --file=backup-2026-10-12.dump
```
Restore into any PostgreSQL 16+ target:
```powershell
pg_restore --dbname=<target-url> --no-owner backup-2026-10-12.dump
```
> The pooled URL in `DATABASE_URL` is for the application. `DATABASE_URL_UNPOOLED`
> (also in `.env`) is for dumps, migrations, and DDL sessions.

## 4. Restore verification checklist

1. `node scripts/verify-postgres.js` (against the restored target) — all PASS lines.
2. Start the app; `GET /health` → `database: up, driver: postgres`.
3. Sign in to `/manage`; dashboard counts match the pre-incident snapshot.
4. Create + delete a scratch row; confirm the SSE event fires in a second manage tab.

## 5. Schema changes (migration discipline)

1. Write the change as a numbered file in `src/db/migrations/` (e.g. `002_add_x.sql`).
   - The SQLite runner applies `*.sql` verbatim; when dialects differ, pair files
     (`002_add_x.sql` + `002_add_x.pg.sql`) and extend the PostgreSQL applier to
     prefer the `.pg.sql` variant (currently the PostgreSQL baseline is applied
     wholesale from `src/db/schema.postgres.sql`).
2. Rehearse on a Neon branch: `neon branches create --name mig-002-rehearsal`, run the
   full suite against it (`DB_DRIVER=postgres DATABASE_URL=<branch> npm test -- --runInBand`),
   delete the branch.
3. Apply to production by restarting the app (idempotent baseline) or executing the
   migration manually via the unpooled URL; then `node scripts/verify-postgres.js`.
4. Snapshot a branch **before** applying destructive changes (see 3.1).

## 6. Test-database strategy (CI)

- SQLite lane (`verify`): hermetic, parallel, per-worker temp files.
- PostgreSQL lane (`verify-postgres`): `postgres:16` service container; `tests/jest-global-setup.js`
  drops/recreates the schema once; suites run serially (`--runInBand`) and call
  `resetTestData()` (helpers) between tests — `TRUNCATE … RESTART IDENTITY CASCADE`.
- Neon rehearsal branches substitute for the service container when testing against
  the real cloud endpoint (create → run → delete; see 5.2).

## 7. Connection notes

- Application uses the **pooled** endpoint; keep `max` small (`PG_POOL_MAX`, default 5).
- `pg_dump`, migrations, and manual SQL: use the **unpooled** endpoint.
- TLS: `sslmode=require` is enforced as `verify-full` by node-pg 8 — Neon certificates
  verify successfully; only relax with `PG_ALLOW_SELF_SIGNED=1` for unusual networks.
- Sequences advance on rollback — never assume dense ids; read them from `RETURNING`.
