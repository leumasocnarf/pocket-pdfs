# Build stage
FROM oven/bun:1.3.0 AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Sentry DSN injected at build time
ARG VITE_SENTRY_DSN
ARG VITE_ENVIRONMENT
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_ENVIRONMENT=$VITE_ENVIRONMENT

# Build the app
COPY . .
RUN bun run build

# Runtime stage
FROM nginx:1.29-alpine AS runner

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]