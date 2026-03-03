# ── deps ──────────────────────────────────────────────
FROM node:24-alpine AS deps
RUN corepack enable
ENV CI=true

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/mastra/package.json apps/mastra/
COPY packages/schemas/package.json packages/schemas/

RUN pnpm install --frozen-lockfile

# ── build ────────────────────────────────────────────
FROM deps AS build

COPY packages/schemas packages/schemas
COPY apps/mastra apps/mastra
RUN pnpm --filter @tubebook/schemas build && pnpm --filter ./apps/mastra build

# ── runner ────────────────────────────────────────────
FROM node:24-alpine AS runner

WORKDIR /app

COPY --from=build /app/apps/mastra/.mastra/output apps/mastra/.mastra/output

USER node

EXPOSE 4111

CMD ["node", "apps/mastra/.mastra/output/index.mjs"]
