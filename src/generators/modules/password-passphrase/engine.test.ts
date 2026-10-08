import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generatePassword, generatePassphrase, calculateEntropy, getRandomInt } from "./engine";

describe("Password & Passphrase CSPRNG Engine", () => {
  describe("getRandomInt", () => {
    it("should return values strictly within [0, max - 1]", () => {
      for (let i = 0; i < 100; i++) {
        const val = getRandomInt(10);
        assert.ok(val >= 0 && val < 10);
      }
    });

    it("should reject negative or zero max", () => {
      assert.throws(() => getRandomInt(0), /Max must be positive/);
      assert.throws(() => getRandomInt(-5), /Max must be positive/);
    });
  });

  describe("generatePassword", () => {
    it("should generate password with exact specified length", () => {
      const p16 = generatePassword({
        length: 16,
        useUpper: true,
        useLower: true,
        useNumbers: true,
        useSymbols: true,
      });
      assert.equal(p16.length, 16);

      const p32 = generatePassword({
        length: 32,
        useUpper: true,
        useLower: true,
        useNumbers: true,
        useSymbols: false,
      });
      assert.equal(p32.length, 32);
    });

    it("should include guaranteed character types when enabled", () => {
      for (let i = 0; i < 20; i++) {
        const pass = generatePassword({
          length: 12,
          useUpper: true,
          useLower: true,
          useNumbers: true,
          useSymbols: true,
        });
        assert.ok(/[A-Z]/.test(pass), `Expected uppercase in ${pass}`);
        assert.ok(/[a-z]/.test(pass), `Expected lowercase in ${pass}`);
        assert.ok(/[0-9]/.test(pass), `Expected number in ${pass}`);
        assert.ok(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pass), `Expected symbol in ${pass}`);
      }
    });

    it("should respect excludeAmbiguous option", () => {
      for (let i = 0; i < 20; i++) {
        const pass = generatePassword({
          length: 24,
          useUpper: true,
          useLower: true,
          useNumbers: true,
          useSymbols: false,
          excludeAmbiguous: true,
        });
        // Check standard ambiguous characters: I, l, 1, 0, O
        assert.ok(!/[Il10O]/.test(pass), `Found ambiguous character in: ${pass}`);
      }
    });

    it("should throw for invalid length bounds", () => {
      assert.throws(() => generatePassword({ length: 2, useUpper: true, useLower: true, useNumbers: true, useSymbols: true }));
      assert.throws(() => generatePassword({ length: 200, useUpper: true, useLower: true, useNumbers: true, useSymbols: true }));
    });
  });

  describe("generatePassphrase", () => {
    it("should generate passphrase with exact word count", () => {
      const phrase = generatePassphrase({
        wordCount: 4,
        separator: "-",
        capitalize: false,
        includeNumber: false,
      });
      const parts = phrase.split("-");
      assert.equal(parts.length, 4);
    });

    it("should append 2-digit number when includeNumber is true", () => {
      const phrase = generatePassphrase({
        wordCount: 5,
        separator: "_",
        capitalize: true,
        includeNumber: true,
      });
      const parts = phrase.split("_");
      assert.equal(parts.length, 6);
      const lastPart = parts[5];
      assert.ok(/^\d{2}$/.test(lastPart), `Expected 2 digits at end, got ${lastPart}`);
    });

    it("should respect capitalize flag", () => {
      const phrase = generatePassphrase({
        wordCount: 3,
        separator: " ",
        capitalize: true,
        includeNumber: false,
      });
      const parts = phrase.split(" ");
      for (const p of parts) {
        assert.equal(p[0], p[0].toUpperCase());
      }
    });
  });

  describe("calculateEntropy", () => {
    it("should calculate nonzero entropy for generated password", () => {
      const entropy = calculateEntropy("k8#P9!mX2$vL5@wQ", false, 0, 70);
      assert.ok(entropy > 80, `Expected entropy > 80 bits, got ${entropy}`);
    });

    it("should calculate strong entropy for 5-word Diceware phrase", () => {
      const entropy = calculateEntropy("Falcon-Meadow-Beacon-Orbit-Crystal-42", true, 5);
      assert.ok(entropy >= 45, `Expected passphrase entropy >= 45 bits, got ${entropy}`);
    });
  });
});
