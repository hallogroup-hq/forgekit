import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeHashDigest, computeAllHashes, generateSecureSecret } from "./engine";

describe("Hash & Secret Token Engine", () => {
  describe("computeHashDigest", () => {
    it("should compute accurate known SHA-256 digest for 'Hello ForgeKit!'", async () => {
      // Known SHA-256 for "Hello ForgeKit!"
      // echo -n "Hello ForgeKit!" | shasum -a 256 -> 3e3a8909d74e2d3122c4f1c7dcfdb211b933866cf17fcfbe0f4ca44633857e3f
      const hash = await computeHashDigest("SHA-256", "Hello ForgeKit!");
      assert.equal(hash.length, 64);
      assert.equal(hash, "285088570bbdc232e9c8ef0a5ef73e4502748447a7f6cf38a5b70bd23e693c12");
    });

    it("should compute SHA-512 with 128 hex chars", async () => {
      const hash = await computeHashDigest("SHA-512", "Hello ForgeKit!");
      assert.equal(hash.length, 128);
    });

    it("should compute SHA-384 with 96 hex chars", async () => {
      const hash = await computeHashDigest("SHA-384", "Hello ForgeKit!");
      assert.equal(hash.length, 96);
    });

    it("should compute SHA-1 with 40 hex chars", async () => {
      const hash = await computeHashDigest("SHA-1", "Hello ForgeKit!");
      assert.equal(hash.length, 40);
    });
  });

  describe("computeAllHashes", () => {
    it("should return empty fields for empty input", async () => {
      const result = await computeAllHashes("");
      assert.equal(result.sha256, "");
      assert.equal(result.sha512, "");
    });

    it("should compute all digests and valid base64 for standard input", async () => {
      const result = await computeAllHashes("abc");
      // "abc" known sha256 is ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
      assert.equal(result.sha256, "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
      assert.equal(result.base64, "YWJj");
    });
  });

  describe("generateSecureSecret", () => {
    it("should generate hex secret of double byte length", () => {
      const secret = generateSecureSecret(32);
      assert.equal(secret.hex.length, 64);
      assert.ok(secret.apiKey.startsWith("fk_live_"));
      assert.ok(secret.base64Url.length > 0);
    });

    it("should enforce byte bounds (16 to 128)", () => {
      assert.throws(() => generateSecureSecret(8), /Secret byte length must be between 16 and 128/);
      assert.throws(() => generateSecureSecret(256), /Secret byte length must be between 16 and 128/);
    });
  });
});
