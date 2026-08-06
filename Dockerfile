# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat

FROM base AS deps

ARG PNPM_VERSION=10.28.2
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS builder

COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_KEY_BUFFER
ARG NEXT_PUBLIC_KEY_SECRET

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_KEY_BUFFER=${NEXT_PUBLIC_KEY_BUFFER}
ENV NEXT_PUBLIC_KEY_SECRET=${NEXT_PUBLIC_KEY_SECRET}

RUN pnpm run build

FROM deps AS prod-deps

RUN pnpm prune --prod

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=prod-deps /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

CMD ["./node_modules/.bin/next", "start"]
