import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateUuidV4, generateUuidV7, generateNanoId, generateBatchIds } from "./engine";

describe("UUID & NanoID CSPRNG Engine", () => {
  describe("generateUuidV4", () => {
    it("should generate valid RFC 4122 / 9562 UUIDv4 format", () => {
      const uuid = generateUuidV4();
      const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      assert.ok(regex.test(uuid), `UUIDv4 did not match standard format: ${uuid}`);
    });

    it("should produce unique values across multiple calls", () => {
      const set = new Set<string>();
      for (let i = 0; i < 100; i++) {
        set.add(generateUuidV4());
      }
      assert.equal(set.size, 100);
    });
  });

  describe("generateUuidV7", () => {
    it("should generate valid RFC 9562 UUIDv7 format with version 7 and variant 2", () => {
      const uuid = generateUuidV7();
      const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      assert.ok(regex.test(uuid), `UUIDv7 did not match RFC 9562 format: ${uuid}`);
    });

    it("should encode timestamp monotonically", () => {
      const t1 = 1775600000000;
      const t2 = 1775600001000;
      const u1 = generateUuidV7(t1);
      const u2 = generateUuidV7(t2);
      assert.ok(u1 < u2, `Expected ${u1} to be lexicographically smaller than ${u2}`);
    });

    it("should guarantee monotonic ordering for successive UUIDv7s within same millisecond (RFC 9562 §6.2)", () => {
      const fixedTs = 1775654321000;
      const ids: string[] = [];
      for (let i = 0; i < 20; i++) {
        ids.push(generateUuidV7(fixedTs));
      }

      for (let i = 0; i < ids.length - 1; i++) {
        assert.ok(
          ids[i] < ids[i + 1],
          `Expected id[${i}] (${ids[i]}) to be < id[${i + 1}] (${ids[i + 1]})`
        );
      }
    });
  });

  describe("generateNanoId", () => {
    it("should generate NanoID with exact length", () => {
      const id10 = generateNanoId(10);
      assert.equal(id10.length, 10);
      const id21 = generateNanoId(21);
      assert.equal(id21.length, 21);
    });

    it("should only contain URL-safe characters", () => {
      for (let i = 0; i < 20; i++) {
        const id = generateNanoId(32);
        assert.ok(/^[-_0-9a-zA-Z]{32}$/.test(id), `Non-URL-safe character found: ${id}`);
      }
    });
  });

  describe("generateBatchIds", () => {
    it("should generate batch of requested count", () => {
      const list = generateBatchIds({ type: "uuid4", count: 25 });
      assert.equal(list.length, 25);
    });

    it("should strip hyphens when hyphens: false", () => {
      const list = generateBatchIds({ type: "uuid7", count: 5, hyphens: false });
      for (const id of list) {
        assert.equal(id.includes("-"), false);
        assert.equal(id.length, 32);
      }
    });

    it("should format uppercase when uppercase: true", () => {
      const list = generateBatchIds({ type: "uuid4", count: 5, uppercase: true });
      for (const id of list) {
        assert.equal(id, id.toUpperCase());
      }
    });
  });
});
