"use client";

import React, { useState } from "react";
import { Download, ShieldCheck, Terminal, FileCode } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

type StackType = "nextjs" | "node-express" | "python-fastapi" | "go" | "rust";

interface StackConfig {
  name: string;
  badge: string;
  port: number;
  dockerfile: string;
  gitignore: string;
}

const STACKS: Record<StackType, StackConfig> = {
  nextjs: {
    name: "Next.js (App Router)",
    badge: "Node.js / React",
    port: 3000,
    dockerfile: `# Multi-stage Next.js Production Dockerfile
FROM node:20-alpine AS base

# Step 1: Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Step 2: Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Step 3: Minimal production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]`,
    gitignore: `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing & Coverage
coverage/

# Next.js Build Output
.next/
out/
build/
dist/

# Environment Variables
.env
.env*.local

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS & Editor Files
.DS_Store
Thumbs.db
.vscode/
.idea/`,
  },
  "python-fastapi": {
    name: "Python FastAPI",
    badge: "Python 3.12 / Uvicorn",
    port: 8000,
    dockerfile: `# Multi-stage Python FastAPI Dockerfile
FROM python:3.12-slim AS builder

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final lightweight stage
FROM python:3.12-slim AS runner

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/home/appuser/.local/bin:$PATH"

# Run as non-privileged user for security
RUN groupadd -g 999 appuser && useradd -r -u 999 -g appuser appuser
COPY --from=builder /root/.local /home/appuser/.local
COPY --chown=appuser:appuser . .

USER appuser
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]`,
    gitignore: `# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# Virtual Environments
.venv/
env/
venv/
ENV/

# Distribution / Packaging
build/
dist/
*.egg-info/

# Unit test / Coverage
.coverage
htmlcov/
.pytest_cache/

# Environment secrets
.env
.env.local

# OS & IDE
.DS_Store
.vscode/
.idea/`,
  },
  "node-express": {
    name: "Node.js Express / API",
    badge: "Node.js 20",
    port: 4000,
    dockerfile: `# Multi-stage Node.js API Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=deps /app/node_modules ./node_modules
COPY --chown=appuser:appgroup . .

USER appuser
EXPOSE 4000

CMD ["node", "src/index.js"]`,
    gitignore: `node_modules/
dist/
coverage/
.env
.env.*
*.log
.DS_Store
.idea/
.vscode/`,
  },
  go: {
    name: "Go (Golang)",
    badge: "Go 1.22 / Scratch Minimal",
    port: 8080,
    dockerfile: `# Multi-stage Go Minimal Dockerfile
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/server .

# Ultra-compact scratch / distroless final stage
FROM alpine:3.19 AS runner
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /app
COPY --from=builder /app/server /app/server

EXPOSE 8080
USER nobody:nobody

CMD ["/app/server"]`,
    gitignore: `# Binaries for programs and plugins
*.exe
*.exe~
*.dll
*.so
*.dylib
bin/
server

# Output of the go coverage tool
*.out

# Environment variables
.env
.DS_Store
.idea/
.vscode/`,
  },
  rust: {
    name: "Rust Web Server",
    badge: "Rust / Musl Binary",
    port: 8080,
    dockerfile: `# Multi-stage Rust Production Dockerfile
FROM rust:1.77-alpine AS builder

RUN apk add --no-cache musl-dev
WORKDIR /app

COPY Cargo.toml Cargo.lock ./
# Create dummy main to cache cargo build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

COPY . .
RUN cargo build --release

# Final runtime
FROM alpine:3.19 AS runner
WORKDIR /app
COPY --from=builder /app/target/release/app /app/server

USER nobody
EXPOSE 8080

CMD ["/app/server"]`,
    gitignore: `/target/
Cargo.lock
**/*.rs.bk
.env
.DS_Store
.idea/
.vscode/`,
  },
};

export default function DockerGitignoreGenerator() {
  const [selectedStack, setSelectedStack] = useState<StackType>("nextjs");
  const [activeTab, setActiveTab] = useState<"docker" | "git">("docker");

  const current = STACKS[selectedStack];
  const activeContent = activeTab === "docker" ? current.dockerfile : current.gitignore;
  const activeFilename = activeTab === "docker" ? "Dockerfile" : ".gitignore";

  const handleDownload = () => {
    downloadFile(activeContent, activeFilename, "text/plain");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Tech Stack Selector (Left) */}
      <div className="lg:col-span-4 space-y-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
          Choose Framework & Language
        </label>

        <div className="space-y-2">
          {(Object.keys(STACKS) as StackType[]).map((key) => {
            const stack = STACKS[key];
            const isSelected = selectedStack === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedStack(key)}
                className={`w-full p-3.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                }`}
              >
                <div className="font-semibold text-xs">{stack.name}</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {stack.badge} • Port {stack.port}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Built-in Best Practices</span>
          </div>
          <ul className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1 list-disc list-inside">
            <li>Multi-stage layer caching for fast builds</li>
            <li>Runs as unprivileged non-root user</li>
            <li>Slim Alpine / Scratch base images</li>
            <li>Clean environment variable separation</li>
          </ul>
        </div>
      </div>

      {/* Code Display (Right) */}
      <div className="lg:col-span-8 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("docker")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "docker"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Dockerfile</span>
            </button>
            <button
              onClick={() => setActiveTab("git")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeTab === "git"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>.gitignore</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={activeContent}
              label={`Copy ${activeFilename}`}
              size="sm"
              variant="secondary"
              triggerConfetti
            />
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 max-h-[520px] overflow-y-auto">
          <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre selection:bg-blue-500/20 leading-relaxed">
            {activeContent}
          </pre>
        </div>
      </div>
    </div>
  );
}
