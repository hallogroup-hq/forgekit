import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseHighlightedLines, THEME_CONFIGS, getDefaultCodeSnapperConfig } from "./engine";

describe("Code & Terminal to Image Engine", () => {
  it("should parse highlighted line string into numeric sets", () => {
    const res = parseHighlightedLines("1, 3-5, 8");
    assert.ok(res.has(1));
    assert.ok(!res.has(2));
    assert.ok(res.has(3));
    assert.ok(res.has(4));
    assert.ok(res.has(5));
    assert.ok(!res.has(6));
    assert.ok(res.has(8));
  });

  it("should handle empty or whitespace-only highlight inputs", () => {
    assert.equal(parseHighlightedLines("").size, 0);
    assert.equal(parseHighlightedLines("   ").size, 0);
  });

  it("should provide valid themes with complete color schemes", () => {
    const themes = ["obsidian", "zinc", "monokai", "clean-light"] as const;
    for (const t of themes) {
      const cfg = THEME_CONFIGS[t];
      assert.ok(cfg.bg);
      assert.ok(cfg.text);
      assert.ok(cfg.border);
      assert.ok(cfg.keyword);
    }
  });

  it("should provide working default code snippet configuration", () => {
    const d = getDefaultCodeSnapperConfig();
    assert.ok(d.code.length > 0);
    assert.equal(d.language, "typescript");
    assert.equal(d.theme, "obsidian");
  });
});
