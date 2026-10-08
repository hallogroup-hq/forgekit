import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateDockerfile,
  generateGitignore,
  generateDockerignore,
  generateDockerCompose,
  StackType,
} from "./engine";

describe("Dockerfile & .gitignore Studio Engine", () => {
  const stacks: StackType[] = ["nextjs", "node-express", "python-fastapi", "go", "rust"];

  describe("generateDockerfile", () => {
    it("should generate multi-stage builds with non-root security defaults for all stacks", () => {
      for (const stack of stacks) {
        const dockerfile = generateDockerfile(stack);
        assert.ok(dockerfile.includes("AS builder") || dockerfile.includes("AS base"));
        assert.ok(dockerfile.includes("EXPOSE"));
        assert.ok(dockerfile.includes("CMD"));
      }
    });

    it("should allow custom port override", () => {
      const nextDocker = generateDockerfile("nextjs", { port: 8080 });
      assert.ok(nextDocker.includes("EXPOSE 8080"));
      assert.ok(nextDocker.includes("ENV PORT=8080"));
    });

    it("should include non-root user creation in Go and Next.js", () => {
      const goDocker = generateDockerfile("go", { nonRoot: true });
      assert.ok(goDocker.includes("USER appuser"));

      const nextDocker = generateDockerfile("nextjs", { nonRoot: true });
      assert.ok(nextDocker.includes("USER nextjs"));
    });
  });

  describe("generateGitignore", () => {
    it("should always exclude environment secrets across all stacks", () => {
      for (const stack of stacks) {
        const gitignore = generateGitignore(stack);
        assert.ok(gitignore.includes(".env"));
        assert.ok(gitignore.includes(".DS_Store"));
      }
    });

    it("should include node_modules for node and nextjs", () => {
      const nodeGitignore = generateGitignore("node-express");
      assert.ok(nodeGitignore.includes("node_modules/"));

      const pyGitignore = generateGitignore("python-fastapi");
      assert.ok(pyGitignore.includes("__pycache__/"));
    });

    it("should append custom rules if provided", () => {
      const gitignore = generateGitignore("go", ["*.local.json", "temp-uploads/"]);
      assert.ok(gitignore.includes("*.local.json"));
      assert.ok(gitignore.includes("temp-uploads/"));
    });
  });

  describe("generateDockerignore", () => {
    it("should prevent copying .env and node_modules / caches into container", () => {
      for (const stack of stacks) {
        const dockerignore = generateDockerignore(stack);
        assert.ok(dockerignore.includes(".env"));
        assert.ok(dockerignore.includes(".git"));
      }
    });
  });

  describe("generateDockerCompose", () => {
    it("should create valid docker compose file with exposed port", () => {
      const compose = generateDockerCompose("python-fastapi", "api-backend", 8000);
      assert.ok(compose.includes("api-backend:"));
      assert.ok(compose.includes('"8000:8000"'));
    });
  });
});
