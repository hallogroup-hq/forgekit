import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  detectPotentialRedos,
  safeExecuteRegex,
  generateJsRegexCode,
  generatePythonRegexCode,
  generateGoRegexCode,
} from "./engine";

describe("Regex Tester & Safe Evaluation Engine", () => {
  describe("detectPotentialRedos", () => {
    it("should flag nested quantifier (a+)+ as risky", () => {
      const check = detectPotentialRedos("(a+)+$");
      assert.equal(check.isRisky, true);
      assert.ok(check.reason?.includes("nested quantifier"));
    });

    it("should flag (.*)* as risky", () => {
      const check = detectPotentialRedos("(.*)*");
      assert.equal(check.isRisky, true);
    });

    it("should allow safe standard patterns", () => {
      const check = detectPotentialRedos("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
      assert.equal(check.isRisky, false);
    });
  });

  describe("safeExecuteRegex", () => {
    it("should successfully extract multiple global matches", () => {
      const result = safeExecuteRegex(
        "[0-9]+",
        "g",
        "Item 1 costs 20 dollars, Item 2 costs 50 dollars."
      );
      assert.equal(result.isValid, true);
      assert.equal(result.regexError, null);
      assert.equal(result.matches.length, 4);
      assert.equal(result.matches[0].match, "1");
      assert.equal(result.matches[1].match, "20");
      assert.equal(result.matches[2].match, "2");
      assert.equal(result.matches[3].match, "50");
    });

    it("should capture capture groups", () => {
      const result = safeExecuteRegex(
        "(\\w+)@(\\w+\\.\\w+)",
        "g",
        "user@example.com"
      );
      assert.equal(result.isValid, true);
      assert.equal(result.matches.length, 1);
      assert.equal(result.matches[0].groups[0], "user");
      assert.equal(result.matches[0].groups[1], "example.com");
    });

    it("should gracefully handle syntax errors in regex pattern", () => {
      const result = safeExecuteRegex("[unclosed-group", "", "test string");
      assert.equal(result.isValid, false);
      assert.ok(result.regexError !== null);
    });

    it("should block catastrophic patterns against long strings", () => {
      const result = safeExecuteRegex(
        "(a+)+$",
        "",
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaX"
      );
      assert.equal(result.isValid, false);
      assert.equal(result.isRedosRisky, true);
      assert.ok(result.regexError?.includes("Blocked potentially catastrophic pattern"));
    });
  });

  describe("safeExecuteRegexIsolated (Hard Worker Termination)", () => {
    it("should evaluate regex in isolated worker thread successfully", async () => {
      const { safeExecuteRegexIsolated } = await import("./engine");
      const result = await safeExecuteRegexIsolated(
        "\\d+",
        "g",
        "Order #123 placed with 45 items"
      );
      assert.equal(result.isValid, true);
      assert.equal(result.matches.length, 2);
      assert.equal(result.matches[0].match, "123");
      assert.equal(result.matches[1].match, "45");
    });

    it("should forcefully terminate worker thread when catastrophic regex exceeds hard timeout", async () => {
      const { safeExecuteRegexIsolated } = await import("./engine");
      // Classic ReDoS pattern with backtracking string
      const result = await safeExecuteRegexIsolated(
        "(a+)+$",
        "",
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaa!",
        { maxExecutionTimeMs: 100 }
      );
      // Hard worker termination guarantees main thread isn't frozen
      assert.equal(result.isValid, false);
      assert.ok(result.regexError?.includes("Hard timeout exceeded"));
    });
  });

  describe("Code Generators", () => {
    it("should generate valid JS regex code", () => {
      const code = generateJsRegexCode("[0-9]+", "gi");
      assert.ok(code.includes("const regex = /[0-9]+/gi;"));
      assert.ok(code.includes("matchAll"));
    });

    it("should generate Python re code with flags", () => {
      const code = generatePythonRegexCode("[a-z]+", "im");
      assert.ok(code.includes("import re"));
      assert.ok(code.includes("re.IGNORECASE"));
      assert.ok(code.includes("re.MULTILINE"));
    });

    it("should generate Go regexp code", () => {
      const code = generateGoRegexCode("\\d+");
      assert.ok(code.includes("regexp.MustCompile"));
      assert.ok(code.includes("FindAllString"));
    });
  });
});
