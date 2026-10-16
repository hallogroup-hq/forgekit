import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEVICE_SPECS,
  calculateCanvasSize,
  getDefaultMockupConfig,
  BACKGROUND_PRESETS,
} from "./engine";

describe("Device Mockup Studio Engine", () => {
  it("should have valid specifications for all supported device types", () => {
    const devices = ["iphone", "android", "macbook", "browser", "clay"] as const;
    for (const d of devices) {
      const spec = DEVICE_SPECS[d];
      assert.ok(spec, `Missing spec for device: ${d}`);
      assert.ok(spec.screenWidth > 0);
      assert.ok(spec.screenHeight > 0);
      assert.ok(spec.aspectRatio > 0);
    }
  });

  it("should calculate correct canvas dimensions including padding and scale factor", () => {
    const res = calculateCanvasSize("browser", 48, 2);
    // browser spec: width 920, height 580 + 38 = 618
    // with padding 48 on each side: (920 + 96)*2 = 2032, (618 + 96)*2 = 1428
    assert.equal(res.width, 2032);
    assert.equal(res.height, 1428);
    assert.equal(res.deviceWidth, 920);
    assert.equal(res.deviceHeight, 618);
  });

  it("should provide sane default configuration", () => {
    const cfg = getDefaultMockupConfig();
    assert.equal(cfg.device, "browser");
    assert.equal(cfg.padding, 48);
    assert.equal(cfg.shadow, "deep");
    assert.ok(BACKGROUND_PRESETS.some((b) => b.id === cfg.background));
  });
});
