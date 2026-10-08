import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  escapeWifiField,
  buildWifiPayload,
  buildWhatsappPayload,
  buildVCardPayload,
  composeCompositeSvg,
} from "./engine";

describe("QR Code Studio Engine", () => {
  describe("escapeWifiField", () => {
    it("should escape special characters in Wi-Fi fields", () => {
      assert.equal(escapeWifiField("My;Network"), "My\\;Network");
      assert.equal(escapeWifiField("Pass:word;123"), "Pass\\:word\\;123");
      assert.equal(escapeWifiField("Slash\\Back"), "Slash\\\\Back");
      assert.equal(escapeWifiField('Quote"Name,Comma'), 'Quote\\"Name\\,Comma');
    });

    it("should handle empty or standard strings without change", () => {
      assert.equal(escapeWifiField(""), "");
      assert.equal(escapeWifiField("StandardSSID"), "StandardSSID");
    });
  });

  describe("buildWifiPayload", () => {
    it("should construct valid WPA Wi-Fi payload with escaped characters", () => {
      const payload = buildWifiPayload({
        ssid: "Cafe;Guest:Zone",
        password: "Secret;Pass:2026",
        encryption: "WPA",
        hidden: false,
      });
      assert.equal(
        payload,
        "WIFI:T:WPA;S:Cafe\\;Guest\\:Zone;P:Secret\\;Pass\\:2026;H:false;;"
      );
    });

    it("should format open network without password", () => {
      const payload = buildWifiPayload({
        ssid: "Open_Airport_WiFi",
        encryption: "nopass",
      });
      assert.equal(payload, "WIFI:T:nopass;S:Open_Airport_WiFi;H:false;;");
    });
  });

  describe("buildWhatsappPayload", () => {
    it("should clean phone numbers and encode messages", () => {
      const payload = buildWhatsappPayload("+62 812-3456-7890", "Hello! Price list please?");
      assert.equal(
        payload,
        "https://wa.me/6281234567890?text=Hello!%20Price%20list%20please%3F"
      );
    });

    it("should omit query parameter when message is empty", () => {
      const payload = buildWhatsappPayload("+1 (555) 123-4567", "");
      assert.equal(payload, "https://wa.me/15551234567");
    });
  });

  describe("buildVCardPayload", () => {
    it("should generate valid vCard 3.0 lines", () => {
      const vcard = buildVCardPayload({
        fullName: "Alex Johnson",
        org: "Forge Labs",
        phone: "+15551234567",
        email: "alex@example.com",
      });
      assert.ok(vcard.startsWith("BEGIN:VCARD"));
      assert.ok(vcard.includes("FN:Alex Johnson"));
      assert.ok(vcard.includes("ORG:Forge Labs"));
      assert.ok(vcard.includes("TEL:+15551234567"));
      assert.ok(vcard.endsWith("END:VCARD"));
    });
  });

  describe("composeCompositeSvg", () => {
    it("should embed frame banner and text into vector SVG", () => {
      const rawSvg = `<svg><path d="M0 0h10v10H0z"/></svg>`;
      const composite = composeCompositeSvg({
        baseQrSvg: rawSvg,
        size: 400,
        frameText: "SCAN TO CONNECT",
        fgColor: "#000000",
        bgColor: "#ffffff",
      });

      assert.ok(composite.includes("SCAN TO CONNECT"));
      assert.ok(composite.includes('viewBox="0 0 400 472"'));
      assert.ok(composite.includes("<rect"));
      assert.ok(composite.includes("<text"));
    });

    it("should embed logo image element when logoSvgUri is provided", () => {
      const rawSvg = `<svg><path d="M0 0h10v10H0z"/></svg>`;
      const composite = composeCompositeSvg({
        baseQrSvg: rawSvg,
        size: 400,
        fgColor: "#000000",
        bgColor: "#ffffff",
        logoSvgUri: "data:image/svg+xml;utf8,<svg></svg>",
      });

      assert.ok(composite.includes("<circle"));
      assert.ok(composite.includes("<image href="));
    });

    it("should escape XML special characters in frameText to prevent SVG corruption", () => {
      const rawSvg = `<svg><path d="M0 0h10v10H0z"/></svg>`;
      const composite = composeCompositeSvg({
        baseQrSvg: rawSvg,
        size: 400,
        frameText: "SCAN & PAY <NOW> 'DEAL'",
        fgColor: "#000000",
        bgColor: "#ffffff",
      });

      assert.ok(composite.includes("SCAN &amp; PAY &lt;NOW&gt; &apos;DEAL&apos;"));
      assert.ok(!composite.includes("<NOW>"));
    });
  });

  describe("QR Decoder End-to-End Scanability Verification (jsQR)", () => {
    it("should decode generated standard QR code to exact original text", async () => {
      const QRCode = await import("qrcode");
      const jsQR = (await import("jsqr")).default;

      const testPayload = "https://forgekit.dev/tools/qr-code?campaign=launch2026";
      const qr = QRCode.create(testPayload, { errorCorrectionLevel: "H" });

      const scale = 8;
      const size = qr.modules.size;
      const width = size * scale;
      const height = size * scale;
      const buffer = new Uint8ClampedArray(width * height * 4);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const modX = Math.floor(x / scale);
          const modY = Math.floor(y / scale);
          const isDark = qr.modules.get(modX, modY);
          const idx = (y * width + x) * 4;
          const val = isDark ? 0 : 255;
          buffer[idx] = val;
          buffer[idx + 1] = val;
          buffer[idx + 2] = val;
          buffer[idx + 3] = 255;
        }
      }

      const decoded = jsQR(buffer, width, height);
      assert.ok(decoded !== null, "QR decoder failed to find QR code");
      assert.equal(decoded.data, testPayload);
    });

    it("should decode QR code with center logo overlay up to 22% size with Level H error correction", async () => {
      const QRCode = await import("qrcode");
      const jsQR = (await import("jsqr")).default;

      const testPayload = "WIFI:T:WPA;S:StudioGuest;P:Secret12345;H:false;;";
      const qr = QRCode.create(testPayload, { errorCorrectionLevel: "H" });

      const scale = 8;
      const size = qr.modules.size;
      const width = size * scale;
      const height = size * scale;
      const buffer = new Uint8ClampedArray(width * height * 4);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const modX = Math.floor(x / scale);
          const modY = Math.floor(y / scale);
          const isDark = qr.modules.get(modX, modY);
          const idx = (y * width + x) * 4;
          const val = isDark ? 0 : 255;
          buffer[idx] = val;
          buffer[idx + 1] = val;
          buffer[idx + 2] = val;
          buffer[idx + 3] = 255;
        }
      }

      // Draw center logo covering up to 22% of QR code
      const logoSize = Math.floor(width * 0.22);
      const startX = Math.floor((width - logoSize) / 2);
      const startY = Math.floor((height - logoSize) / 2);
      for (let y = startY; y < startY + logoSize; y++) {
        for (let x = startX; x < startX + logoSize; x++) {
          const idx = (y * width + x) * 4;
          buffer[idx] = 180; // Gray logo
          buffer[idx + 1] = 180;
          buffer[idx + 2] = 180;
          buffer[idx + 3] = 255;
        }
      }

      const decoded = jsQR(buffer, width, height);
      assert.ok(decoded !== null, "QR decoder failed to decode QR code with center logo");
      assert.equal(decoded.data, testPayload);
    });
  });
});
