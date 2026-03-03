# ── deps ──────────────────────────────────────────────
FROM node:24-alpine AS deps
RUN corepack enable
ENV CI=true

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/schemas/package.json packages/schemas/

RUN pnpm install --frozen-lockfile

# ── build ────────────────────────────────────────────
FROM deps AS build

COPY packages/schemas packages/schemas
COPY .env apps/web/.env
COPY apps/web apps/web
RUN pnpm --filter @texturu/schemas build && pnpm --filter ./apps/web build && rm -f apps/web/.env

# ── runner ────────────────────────────────────────────
FROM node:24-alpine AS runner

WORKDIR /app

COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static apps/web/.next/static
COPY --from=build /app/apps/web/public apps/web/public

USER node

EXPOSE 80

CMD ["node", "apps/web/server.js"]
