/**
 * Dockerfile & .gitignore Studio Engine
 * Generates battle-tested multi-stage Dockerfiles, lean .dockerignore files,
 * comprehensive .gitignore files, and docker-compose configurations.
 */

export type StackType = "nextjs" | "node-express" | "python-fastapi" | "go" | "rust";

export interface StackDefinition {
  name: string;
  badge: string;
  defaultPort: number;
}

export const STACK_DEFINITIONS: Record<StackType, StackDefinition> = {
  nextjs: {
    name: "Next.js (App Router)",
    badge: "Node.js 20 / React",
    defaultPort: 3000,
  },
  "node-express": {
    name: "Node.js & Express",
    badge: "TypeScript / Node 20",
    defaultPort: 4000,
  },
  "python-fastapi": {
    name: "Python FastAPI",
    badge: "Python 3.12 / Uvicorn",
    defaultPort: 8000,
  },
  go: {
    name: "Go (Golang)",
    badge: "Go 1.22 / Scratch / Alpine",
    defaultPort: 8080,
  },
  rust: {
    name: "Rust (Actix/Axum)",
    badge: "Rust 1.78 / Debian Slim",
    defaultPort: 8080,
  },
};

export function generateDockerfile(
  stack: StackType,
  options?: { port?: number; nonRoot?: boolean }
): string {
  const port = options?.port ?? STACK_DEFINITIONS[stack].defaultPort;
  const nonRoot = options?.nonRoot ?? true;

  switch (stack) {
    case "nextjs":
      return `# Multi-stage Next.js Production Dockerfile
FROM node:20-alpine AS base

# 1. Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN \\
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \\
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \\
  else npm ci; \\
  fi

# 2. Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Minimal production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
${
  nonRoot
    ? `
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs`
    : `
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static`
}

EXPOSE ${port}
ENV PORT=${port}
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
`;

    case "node-express":
      return `# Multi-stage Node.js Production Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build || true

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
${
  nonRoot
    ? `
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser`
    : ""
}

COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist

EXPOSE ${port}
CMD ["node", "dist/index.js"]
`;

    case "python-fastapi":
      return `# Multi-stage Python FastAPI Dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.12-slim AS runner
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
${
  nonRoot
    ? `
RUN useradd -m -u 1000 appuser
USER appuser`
    : ""
}

COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
COPY . .

EXPOSE ${port}
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${port}"]
`;

    case "go":
      return `# Multi-stage Go Static Binary Dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o server .

FROM alpine:3.19 AS runner
WORKDIR /app
RUN apk --no-cache add ca-certificates tzdata
${
  nonRoot
    ? `
RUN adduser -D -u 10001 appuser
USER appuser`
    : ""
}
COPY --from=builder /app/server .

EXPOSE ${port}
CMD ["./server"]
`;

    case "rust":
      return `# Multi-stage Rust Production Dockerfile
FROM rust:1.78-slim-bullseye AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
RUN cargo build --release

FROM debian:bullseye-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y ca-certificates libssl1.1 && rm -rf /var/lib/apt/lists/*
${
  nonRoot
    ? `
RUN useradd -m -u 1000 appuser
USER appuser`
    : ""
}
COPY --from=builder /app/target/release/server ./server

EXPOSE ${port}
CMD ["./server"]
`;
  }
}

export function generateGitignore(stack: StackType, customRules?: string[]): string {
  const commonHeader = `# OS & Editor
.DS_Store
Thumbs.db
*.swp
.vscode/
.idea/

# Environment Variables & Secrets
.env
.env*.local
*.pem
*.key
`;

  let specific = "";
  switch (stack) {
    case "nextjs":
    case "node-express":
      specific = `# Node & Package Managers
node_modules/
.pnp
.pnp.js
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Build Outputs
dist/
build/
.next/
out/
coverage/
`;
      break;
    case "python-fastapi":
      specific = `# Python Bytecode & Environments
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
.venv/

# Testing & Coverage
.pytest_cache/
.coverage
htmlcov/
`;
      break;
    case "go":
      specific = `# Go Binaries & Tests
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
/bin/
/dist/
vendor/
`;
      break;
    case "rust":
      specific = `# Rust Build Output
/target/
**/*.rs.bk
*.pdb
`;
      break;
  }

  const custom = customRules && customRules.length > 0 ? `\n# Custom Rules\n${customRules.join("\n")}\n` : "";

  return `${commonHeader}\n${specific}${custom}`.trim() + "\n";
}

export function generateDockerignore(stack: StackType): string {
  const base = `node_modules
.git
.gitignore
.env
.env*.local
README.md
*.md
.vscode
.idea
Dockerfile*
docker-compose*.yml
`;

  switch (stack) {
    case "nextjs":
      return `${base}.next\nout\ncoverage\n`;
    case "node-express":
      return `${base}dist\ncoverage\n`;
    case "python-fastapi":
      return `__pycache__\n*.pyc\n.pytest_cache\nvenv\n.venv\n${base}`;
    case "go":
      return `bin\nvendor\n${base}`;
    case "rust":
      return `target\n${base}`;
  }
}

export function generateDockerCompose(
  stack: StackType,
  serviceName: string = "app",
  port?: number
): string {
  const appPort = port ?? STACK_DEFINITIONS[stack].defaultPort;
  return `version: '3.8'

services:
  ${serviceName}:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${serviceName}
    restart: unless-stopped
    ports:
      - "${appPort}:${appPort}"
    environment:
      - NODE_ENV=production
      - PORT=${appPort}
    env_file:
      - .env
`;
}
