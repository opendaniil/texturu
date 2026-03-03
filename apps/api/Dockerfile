# ── deps ──────────────────────────────────────────────
FROM node:24-alpine AS deps
RUN corepack enable
ENV CI=true

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/schemas/package.json packages/schemas/

RUN pnpm install --frozen-lockfile

# ── build ────────────────────────────────────────────
FROM deps AS build

COPY packages/schemas packages/schemas
COPY apps/api apps/api
RUN pnpm --filter @texturu/schemas build && pnpm --filter ./apps/api build
RUN pnpm deploy --filter ./apps/api --prod /deploy

# ── runner ────────────────────────────────────────────
FROM node:24-alpine AS runner
RUN corepack enable && apk add --no-cache 'yt-dlp=~2026'

WORKDIR /app

COPY --from=build /deploy .
COPY --from=build /app/apps/api/dist dist

COPY apps/api/kysely.config.ts ./
COPY apps/api/src/infra/database/migrations src/infra/database/migrations

USER node

EXPOSE 3000

CMD ["node", "dist/src/main"]
