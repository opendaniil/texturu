# tubebook

Monorepo for a YouTube video processing app.

## Apps

- `apps/api` - NestJS API (`/api/*`), PostgreSQL (Kysely), BullMQ queue workers
- `apps/web` - Next.js frontend
- `apps/mastra` - Mastra ai service

## Packages

- `packages/schemas` - shared Zod schemas for API and Web
