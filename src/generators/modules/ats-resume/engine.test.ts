import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calculateAtsScore, getDefaultResumeData } from "./engine";

describe("ATS Resume / CV Builder Engine", () => {
  it("should score 100% on complete default resume profile", () => {
    const data = getDefaultResumeData();
    const result = calculateAtsScore(data);
    assert.equal(result.score, 100);
    assert.equal(result.passedChecks, result.totalChecks);
  });

  it("should penalize score when essential contact info or experiences are missing", () => {
    const data = getDefaultResumeData();
    data.email = "";
    data.phone = "";
    data.experiences = [];

    const result = calculateAtsScore(data);
    assert.ok(result.score < 80);
    assert.ok(result.items.some((i) => !i.passed));
  });

  it("should provide valid default resume template structure", () => {
    const data = getDefaultResumeData();
    assert.equal(data.template, "tech-ats");
    assert.ok(data.skills.length >= 3);
    assert.ok(data.education.length >= 1);
  });
});
