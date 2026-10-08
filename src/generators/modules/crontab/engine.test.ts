import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  validateCronField,
  validateCronExpression,
  explainCron,
  calculateNextRuns,
} from "./engine";

describe("Crontab Expression Studio Engine", () => {
  describe("validateCronField", () => {
    it("should accept wildcards, steps, ranges, and comma-separated numbers", () => {
      assert.equal(validateCronField("*", 0, 59), true);
      assert.equal(validateCronField("*/15", 0, 59), true);
      assert.equal(validateCronField("1-5", 0, 6), true);
      assert.equal(validateCronField("0,15,30,45", 0, 59), true);
    });

    it("should reject out-of-range or malformed numbers", () => {
      assert.equal(validateCronField("60", 0, 59), false);
      assert.equal(validateCronField("abc", 0, 59), false);
      assert.equal(validateCronField("5-1", 0, 59), false);
    });
  });

  describe("validateCronExpression", () => {
    it("should validate standard 5-part cron expressions", () => {
      const valid = validateCronExpression("0 0 * * *");
      assert.equal(valid.valid, true);
      assert.equal(valid.parts?.minute, "0");
      assert.equal(valid.parts?.hour, "0");
    });

    it("should reject expressions with incorrect field counts", () => {
      const invalid = validateCronExpression("* * *");
      assert.equal(invalid.valid, false);
      assert.ok(invalid.error?.includes("exactly 5"));
    });
  });

  describe("explainCron", () => {
    it("should explain every minute", () => {
      assert.equal(explainCron("* * * * *"), "Every minute.");
    });

    it("should explain step intervals and weekdays", () => {
      const exp = explainCron("*/15 9 * * 1-5");
      assert.ok(exp.includes("Every 15 minutes"));
      assert.ok(exp.includes("past hour 9:00"));
      assert.ok(exp.includes("on weekdays (Mon through Fri)"));
    });

    it("should explain midnight daily", () => {
      const exp = explainCron("0 0 * * *");
      assert.ok(exp.includes("At minute 0 past hour 0:00."));
    });
  });

  describe("calculateNextRuns", () => {
    it("should return the requested number of upcoming execution dates", () => {
      const baseDate = new Date("2026-01-01T00:00:00Z");
      const runs = calculateNextRuns("*/10 * * * *", 3, baseDate);
      assert.equal(runs.length, 3);
      assert.equal(runs[0].getMinutes() % 10, 0);
      assert.equal(runs[1].getMinutes() % 10, 0);
    });

    it("should calculate correct daily time", () => {
      const baseDate = new Date("2026-01-01T00:00:00Z");
      const runs = calculateNextRuns("30 4 * * *", 2, baseDate);
      assert.equal(runs.length, 2);
      assert.equal(runs[0].getHours(), 4);
      assert.equal(runs[0].getMinutes(), 30);
    });
  });
});
