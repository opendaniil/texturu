# tubebook

Monorepo for a YouTube video processing app.

## Apps

- `apps/api` - NestJS API (`/api/*`), PostgreSQL (Kysely), BullMQ queue workers
- `apps/web` - Next.js frontend
- `apps/mastra` - Mastra sandbox app (currently not enabled in `docker-compose.dev.yml`)

## Packages

- `packages/schemas` - shared Zod schemas for API and Web

## Prerequisites

- Docker + Docker Compose
- `pnpm` (for local non-docker workflows)

## Environment

Create `.env` in the repo root with at least:

- `NODE_ENV=development`
- `API_PORT=3000`
- `WEB_PORT=3001`
- `POSTGRES_USER=...`
- `POSTGRES_PASSWORD=...`
- `POSTGRES_DB=...`
- `POSTGRES_HOST=postgres`
- `POSTGRES_PORT=5432`
- `REDIS_HOST=redis`
- `REDIS_PORT=6379`
- `WEB_HOST=http://localhost:3001`
- `NEXT_PUBLIC_API_HOST=http://localhost:3000`

## Run (Docker)

```bash
pnpm dev
```

This starts:

- API at `http://localhost:${API_PORT}/api`
- Web at `http://localhost:${WEB_PORT}`
- Postgres + Redis
- Shared schema watcher (`packages/schemas`) for hot reload

Stop services:

```bash
pnpm down
```

## API Endpoints (current)

- `GET /api/health/live`
- `GET /api/health/ready`
- `POST /api/video`
- `GET /api/video/:id`
- `GET /api/video/:id/status`

## Notes

- Queue worker logic in `apps/api/src/modules/video/video-job.worker.ts` is still a scaffold and needs business processing implementation.
