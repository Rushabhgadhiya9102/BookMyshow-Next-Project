# Multi-stage production Dockerfile for BookMyShow Web frontend (Section 134)
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Stage 1: Build Next.js Web Application
FROM base AS builder
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN npm ci

# Generate Prisma Client & build workspace dependencies
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma
RUN npm run build --workspace=@bookmyshow/database
RUN npm run build --workspace=@bookmyshow/web

# Stage 2: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web ./apps/web

USER nextjs
EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=@bookmyshow/web"]
