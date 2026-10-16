import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatRecordingTime, formatFileSize, RESOLUTION_PRESETS } from "./engine";

describe("Screen & Webcam Recorder Engine", () => {
  it("should format recording durations properly", () => {
    assert.equal(formatRecordingTime(0), "00:00");
    assert.equal(formatRecordingTime(45), "00:45");
    assert.equal(formatRecordingTime(125), "02:05");
    assert.equal(formatRecordingTime(3665), "01:01:05");
  });

  it("should format file sizes accurately", () => {
    assert.equal(formatFileSize(0), "0 B");
    assert.equal(formatFileSize(1024), "1.0 KB");
    assert.equal(formatFileSize(1048576), "1.0 MB");
    assert.equal(formatFileSize(15728640), "15.0 MB");
  });

  it("should have valid resolution presets configured", () => {
    assert.equal(RESOLUTION_PRESETS["1080p"].width, 1920);
    assert.equal(RESOLUTION_PRESETS["720p"].width, 1280);
    assert.ok(RESOLUTION_PRESETS["1080p"].videoBitsPerSecond > 0);
  });
});
