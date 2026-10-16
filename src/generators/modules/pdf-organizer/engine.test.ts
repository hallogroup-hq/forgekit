import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  PageItem,
  reorderPages,
  rotatePage,
  parsePageRangeString,
} from "./engine";

describe("PDF Merge, Split & Page Organizer Engine", () => {
  const dummyPages: PageItem[] = [
    { id: "p1", fileId: "f1", sourceFileName: "doc1.pdf", sourcePageIndex: 0, rotation: 0 },
    { id: "p2", fileId: "f1", sourceFileName: "doc1.pdf", sourcePageIndex: 1, rotation: 0 },
    { id: "p3", fileId: "f2", sourceFileName: "doc2.pdf", sourcePageIndex: 0, rotation: 0 },
  ];

  it("should reorder pages properly", () => {
    // Move p3 (index 2) to first position (index 0)
    const reordered = reorderPages(dummyPages, 2, 0);
    assert.equal(reordered[0].id, "p3");
    assert.equal(reordered[1].id, "p1");
    assert.equal(reordered[2].id, "p2");
  });

  it("should rotate page incrementally by 90 degrees", () => {
    let rotated = rotatePage(dummyPages, "p2", 90);
    assert.equal(rotated[1].rotation, 90);

    rotated = rotatePage(rotated, "p2", 90);
    assert.equal(rotated[1].rotation, 180);

    rotated = rotatePage(rotated, "p2", 180);
    assert.equal(rotated[1].rotation, 0); // 360 % 360 = 0
  });

  it("should parse range strings into 0-indexed page numbers", () => {
    const indices = parsePageRangeString("1-3, 5, 8", 10);
    assert.deepEqual(indices, [0, 1, 2, 4, 7]);
  });

  it("should handle edge cases in range string parsing", () => {
    assert.deepEqual(parsePageRangeString("", 5), []);
    assert.deepEqual(parsePageRangeString("invalid, 2", 5), [1]);
    assert.deepEqual(parsePageRangeString("100-200", 5), []);
  });
});
