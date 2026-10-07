# Multi-stage production Dockerfile for BookMyShow NestJS API (Section 134)
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Stage 1: Build application and monorepo dependencies
FROM base AS builder
WORKDIR /app

COPY package.json package-lock.json turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN npm ci

# Generate Prisma Client & build workspace packages
RUN npx prisma generate --schema=./packages/database/prisma/schema.prisma
RUN npm run build --workspace=@bookmyshow/database
RUN npm run build --workspace=@bookmyshow/api

# Stage 2: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

USER nestjs
EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
