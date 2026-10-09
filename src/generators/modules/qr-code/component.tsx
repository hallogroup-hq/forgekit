"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import {
  Download,
  Wifi,
  Link as LinkIcon,
  Contact,
  Mail,
  FileText,
  MessageSquare,
  Coins,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import confetti from "canvas-confetti";
import { downloadFile } from "@/lib/utils";
import {
  buildWifiPayload,
  buildWhatsappPayload,
  buildVCardPayload,
  composeCompositeSvg,
} from "./engine";

type QrType = "url" | "wifi" | "whatsapp" | "vcard" | "crypto" | "email" | "text";

type LogoPreset = "none" | "custom" | "website" | "whatsapp" | "wifi" | "github" | "crypto";

type FrameStyle = "none" | "scan-me" | "wifi" | "whatsapp" | "custom";

export default function QrCodeGenerator() {
  const [type, setType] = useState<QrType>("url");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Payload fields
  const [url, setUrl] = useState("https://forgekit.dev");
  const [text, setText] = useState("Scan to explore ForgeKit");

  // WiFi fields
  const [ssid, setSsid] = useState("Cafe_HighSpeed_WiFi");
  const [wifiPassword, setWifiPassword] = useState("GuestPass2026");
  const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);

  // WhatsApp fields
  const [waPhone, setWaPhone] = useState("+6281234567890");
  const [waMessage, setWaMessage] = useState("Hello! I found your QR code and would like to ask a few questions.");

  // vCard fields
  const [vcardName, setVcardName] = useState("Alex Johnson");
  const [vcardPhone, setVcardPhone] = useState("+1 555 123 4567");
  const [vcardEmail, setVcardEmail] = useState("alex@company.com");
  const [vcardOrg, setVcardOrg] = useState("Forge Labs Inc.");
  const [vcardTitle, setVcardTitle] = useState("Lead Systems Architect");
  const [vcardWeb, setVcardWeb] = useState("https://company.com");

  // Crypto fields
  const [cryptoCoin, setCryptoCoin] = useState<"bitcoin" | "ethereum">("bitcoin");
  const [cryptoAddress, setCryptoAddress] = useState("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq");
  const [cryptoAmount, setCryptoAmount] = useState("0.025");

  // Email fields
  const [emailTo, setEmailTo] = useState("contact@example.com");
  const [emailSubject, setEmailSubject] = useState("Project Inquiry");
  const [emailBody, setEmailBody] = useState("Hi,\n\nI scanned your QR code and would like to connect.");

  // Visual Customization
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("H"); // Default H for logo support
  const [margin, setMargin] = useState(2);
  const [exportRes, setExportRes] = useState<400 | 1000 | 2000>(1000);

  // Center Logo
  const [logoPreset, setLogoPreset] = useState<LogoPreset>("none");
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);

  // Frame
  const [frameStyle, setFrameStyle] = useState<FrameStyle>("scan-me");
  const [customFrameText, setCustomFrameText] = useState("SCAN ME");

  const [copied, setCopied] = useState(false);

  // Generate payload string
  const getPayload = useCallback((): string => {
    switch (type) {
      case "url": {
        let clean = url.trim();
        if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
          clean = `https://${clean}`;
        }
        return clean;
      }
      case "wifi":
        return buildWifiPayload({
          ssid,
          password: wifiPassword,
          encryption: wifiEncryption,
          hidden: wifiHidden,
        });
      case "whatsapp":
        return buildWhatsappPayload(waPhone, waMessage);
      case "vcard":
        return buildVCardPayload({
          fullName: vcardName,
          org: vcardOrg,
          title: vcardTitle,
          phone: vcardPhone,
          email: vcardEmail,
          url: vcardWeb,
        });
      case "crypto":
        if (cryptoCoin === "bitcoin") {
          return `bitcoin:${cryptoAddress}${cryptoAmount ? `?amount=${cryptoAmount}` : ""}`;
        }
        return `ethereum:${cryptoAddress}${cryptoAmount ? `?value=${cryptoAmount}` : ""}`;
      case "email":
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case "text":
      default:
        return text;
    }
  }, [
    type,
    url,
    wifiEncryption,
    ssid,
    wifiPassword,
    wifiHidden,
    waPhone,
    waMessage,
    vcardName,
    vcardOrg,
    vcardTitle,
    vcardPhone,
    vcardEmail,
    vcardWeb,
    cryptoCoin,
    cryptoAddress,
    cryptoAmount,
    emailTo,
    emailSubject,
    emailBody,
    text,
  ]);

  // Handle custom logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setCustomLogoUrl(evt.target.result as string);
        setLogoPreset("custom");
      }
    };
    reader.readAsDataURL(file);
  };

  // Get logo data url or SVG icon
  const getLogoImage = useCallback((): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      if (logoPreset === "none") {
        resolve(null);
        return;
      }
      if (logoPreset === "custom" && customLogoUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = customLogoUrl;
        return;
      }

      // Built-in SVG logos
      let svgContent = "";
      if (logoPreset === "whatsapp") {
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>`;
      } else if (logoPreset === "wifi") {
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000"><path d="M12 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-4.95-3.05a7 7 0 0 1 9.9 0l1.41-1.41a9 9 0 0 0-12.72 0l1.41 1.41zm-2.83-2.83a11 11 0 0 1 15.56 0l1.41-1.41a13 13 0 0 0-18.38 0l1.41 1.41z"/></svg>`;
      } else if (logoPreset === "github") {
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>`;
      } else if (logoPreset === "crypto") {
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F7931A"><path d="M23.638 14.904c-1.602 6.43-8.09 10.34-14.52 8.736C2.69 22.04-1.22 15.55.384 9.12 1.986 2.69 8.474-1.22 14.904.384c6.43 1.602 10.34 8.09 8.734 14.52zM17.06 10.42c.23-.974-.59-1.498-1.597-1.847l.326-1.306-.795-.2-.317 1.27c-.21-.053-.424-.103-.637-.152l.32-1.28-.795-.198-.326 1.305c-.173-.04-.342-.078-.507-.119l.002-.007-1.097-.274-.212.85s.59.135.578.144c.322.08.38.293.37.463l-.372 1.49c.022.006.052.015.084.027l-.086-.022-.52 2.086c-.04.098-.14.246-.367.19.008.012-.577-.144-.577-.144l-.396.913 1.035.258c.193.048.38.098.566.145l-.33 1.326.794.198.326-1.306c.217.058.43.113.638.165l-.324 1.3.795.198.33-1.324c1.357.257 2.378.153 2.808-.075.346-.66.017-1.042-.462-1.29.349-.08.612-.31.683-.784z"/></svg>`;
      } else {
        svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000"><circle cx="12" cy="12" r="10"/></svg>`;
      }

      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
    });
  }, [logoPreset, customLogoUrl]);

  // Render QR Canvas with Frame and Center Badge
  const renderCanvas = useCallback(async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const payload = getPayload();
    if (!payload.trim()) return;

    // Temporary canvas for QR code
    const qrSize = 360;
    const tempCanvas = document.createElement("canvas");

    try {
      await QRCode.toCanvas(tempCanvas, payload, {
        width: qrSize,
        margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorLevel,
      });

      // Frame dimension calculation
      const hasFrame = frameStyle !== "none";
      const frameHeight = hasFrame ? 70 : 0;
      const totalWidth = qrSize;
      const totalHeight = qrSize + frameHeight;

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      // Draw background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      // Draw QR code
      ctx.drawImage(tempCanvas, 0, 0);

      // Draw center logo if enabled
      const logoImg = await getLogoImage();
      if (logoImg) {
        const logoSize = qrSize * 0.22;
        const logoX = (qrSize - logoSize) / 2;
        const logoY = (qrSize - logoSize) / 2;

        // Draw badge background backing
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.arc(qrSize / 2, qrSize / 2, (logoSize / 2) * 1.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = fgColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw logo image
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      }

      // Draw frame banner if enabled
      if (hasFrame) {
        let textBanner = "SCAN ME";
        if (frameStyle === "wifi") textBanner = "CONNECT TO WI-FI";
        if (frameStyle === "whatsapp") textBanner = "CHAT ON WHATSAPP";
        if (frameStyle === "custom") textBanner = customFrameText || "SCAN ME";

        // Frame bar
        ctx.fillStyle = fgColor;
        ctx.fillRect(16, qrSize - 4, totalWidth - 32, 54);

        // Frame text
        ctx.fillStyle = bgColor;
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(textBanner, totalWidth / 2, qrSize + 23);
      }
    } catch (err) {
      console.error("QR Code rendering error:", err);
    }
  }, [getPayload, margin, fgColor, bgColor, errorLevel, frameStyle, customFrameText, getLogoImage]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // High-Resolution Export
  const handleDownloadPng = async () => {
    const payload = getPayload();
    if (!payload.trim()) return;

    // Render on high-res canvas
    const res = exportRes;
    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    const qrSize = res;
    const tempCanvas = document.createElement("canvas");

    await QRCode.toCanvas(tempCanvas, payload, {
      width: qrSize,
      margin,
      color: { dark: fgColor, light: bgColor },
      errorCorrectionLevel: errorLevel,
    });

    const hasFrame = frameStyle !== "none";
    const frameHeight = hasFrame ? Math.round(res * 0.18) : 0;
    exportCanvas.width = qrSize;
    exportCanvas.height = qrSize + frameHeight;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(tempCanvas, 0, 0);

    const logoImg = await getLogoImage();
    if (logoImg) {
      const logoSize = qrSize * 0.22;
      const logoX = (qrSize - logoSize) / 2;
      const logoY = (qrSize - logoSize) / 2;

      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.arc(qrSize / 2, qrSize / 2, (logoSize / 2) * 1.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = fgColor;
      ctx.lineWidth = Math.max(2, Math.round(res / 150));
      ctx.stroke();
      ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    }

    if (hasFrame) {
      let textBanner = "SCAN ME";
      if (frameStyle === "wifi") textBanner = "CONNECT TO WI-FI";
      if (frameStyle === "whatsapp") textBanner = "CHAT ON WHATSAPP";
      if (frameStyle === "custom") textBanner = customFrameText || "SCAN ME";

      const barPadding = Math.round(res * 0.04);
      const barHeight = Math.round(frameHeight * 0.7);
      ctx.fillStyle = fgColor;
      ctx.fillRect(barPadding, qrSize - 4, exportCanvas.width - barPadding * 2, barHeight);

      ctx.fillStyle = bgColor;
      ctx.font = `bold ${Math.round(res * 0.045)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(textBanner, exportCanvas.width / 2, qrSize + barHeight / 2 - 2);
    }

    exportCanvas.toBlob((blob) => {
      if (blob) {
        downloadFile(blob, `qrcode-${type}-${res}px.png`, "image/png");
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
      }
    });
  };

  const handleDownloadSvg = async () => {
    const payload = getPayload();
    try {
      const rawSvg = await QRCode.toString(payload, {
        type: "svg",
        margin,
        color: { dark: fgColor, light: bgColor },
        errorCorrectionLevel: errorLevel,
      });

      let textBanner = "";
      if (frameStyle !== "none") {
        if (frameStyle === "wifi") textBanner = "CONNECT TO WI-FI";
        else if (frameStyle === "whatsapp") textBanner = "CHAT ON WHATSAPP";
        else if (frameStyle === "custom") textBanner = customFrameText || "SCAN ME";
        else textBanner = "SCAN ME";
      }

      let logoDataUri: string | undefined;
      if (logoPreset === "custom" && customLogoUrl) {
        logoDataUri = customLogoUrl;
      } else if (logoPreset === "whatsapp") {
        logoDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/></svg>')}`;
      } else if (logoPreset === "wifi") {
        logoDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000"><path d="M12 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-4.95-3.05a7 7 0 0 1 9.9 0l1.41-1.41a9 9 0 0 0-12.72 0l1.41 1.41zm-2.83-2.83a11 11 0 0 1 15.56 0l1.41-1.41a13 13 0 0 0-18.38 0l1.41 1.41z"/></svg>')}`;
      } else if (logoPreset === "github") {
        logoDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#000000"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>')}`;
      } else if (logoPreset === "crypto") {
        logoDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F7931A"><path d="M23.638 14.904c-1.602 6.43-8.09 10.34-14.52 8.736C2.69 22.04-1.22 15.55.384 9.12 1.986 2.69 8.474-1.22 14.904.384c6.43 1.602 10.34 8.09 8.734 14.52zM17.06 10.42c.23-.974-.59-1.498-1.597-1.847l.326-1.306-.795-.2-.317 1.27c-.21-.053-.424-.103-.637-.152l.32-1.28-.795-.198-.326 1.305c-.173-.04-.342-.078-.507-.119l.002-.007-1.097-.274-.212.85s.59.135.578.144c.322.08.38.293.37.463l-.372 1.49c.022.006.052.015.084.027l-.086-.022-.52 2.086c-.04.098-.14.246-.367.19.008.012-.577-.144-.577-.144l-.396.913 1.035.258c.193.048.38.098.566.145l-.33 1.326.794.198.326-1.306c.217.058.43.113.638.165l-.324 1.3.795.198.33-1.324c1.357.257 2.378.153 2.808-.075.346-.66.017-1.042-.462-1.29.349-.08.612-.31.683-.784z"/></svg>')}`;
      }

      const compositeSvg = composeCompositeSvg({
        baseQrSvg: rawSvg,
        size: 400,
        frameText: textBanner,
        fgColor,
        bgColor,
        logoSvgUri: logoDataUri,
      });

      downloadFile(compositeSvg, `qrcode-${type}.svg`, "image/svg+xml");
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
    } catch (e) {
      console.error("SVG generation error", e);
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Controls Column (Left) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Payload Type Selector */}
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
            Payload Channel & Format
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "url", label: "Website URL", icon: LinkIcon },
              { id: "wifi", label: "WiFi Access", icon: Wifi },
              { id: "whatsapp", label: "WhatsApp Direct", icon: MessageSquare },
              { id: "vcard", label: "vCard Contact", icon: Contact },
              { id: "crypto", label: "Crypto Wallet", icon: Coins },
              { id: "email", label: "Email Message", icon: Mail },
              { id: "text", label: "Plain Text", icon: FileText },
            ].map((t) => {
              const IconComp = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id as QrType)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-colors ${
                    type === t.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Payload Form */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-4">
          {type === "url" && (
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Destination URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {type === "wifi" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Network SSID (Name)
                </label>
                <input
                  type="text"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    WiFi Password
                  </label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Encryption
                  </label>
                  <select
                    value={wifiEncryption}
                    onChange={(e) => setWifiEncryption(e.target.value as "WPA" | "WEP" | "nopass")}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open Network)</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={wifiHidden}
                  onChange={(e) => setWifiHidden(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>Hidden Network SSID</span>
              </label>
            </div>
          )}

          {type === "whatsapp" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  WhatsApp Phone Number (with Country Code)
                </label>
                <input
                  type="text"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="+6281234567890 or +15551234567"
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Prefilled Message
                </label>
                <textarea
                  rows={2}
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          )}

          {type === "vcard" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={vcardName}
                    onChange={(e) => setVcardName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    value={vcardOrg}
                    onChange={(e) => setVcardOrg(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={vcardTitle}
                    onChange={(e) => setVcardTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={vcardWeb}
                    onChange={(e) => setVcardWeb(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}

          {type === "crypto" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Cryptocurrency
                  </label>
                  <select
                    value={cryptoCoin}
                    onChange={(e) => setCryptoCoin(e.target.value as "bitcoin" | "ethereum")}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  >
                    <option value="bitcoin">Bitcoin (BTC)</option>
                    <option value="ethereum">Ethereum (ETH)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={cryptoAddress}
                    onChange={(e) => setCryptoAddress(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Requested Amount (Optional)
                </label>
                <input
                  type="text"
                  value={cryptoAmount}
                  onChange={(e) => setCryptoAmount(e.target.value)}
                  placeholder="0.05"
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            </div>
          )}

          {type === "email" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Email Body
                </label>
                <textarea
                  rows={2}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            </div>
          )}

          {type === "text" && (
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                Raw Plain Text
              </label>
              <textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />
            </div>
          )}
        </div>

        {/* Styling, Logo & Frame Studio */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Studio Styling & Brand Watermark
          </h3>

          {/* Colors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-500 block mb-1">
                Foreground
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-7 h-7 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-20 px-2 py-0.5 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 block mb-1">
                Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-7 h-7 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-20 px-2 py-0.5 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 block mb-1">
                Margin Border
              </label>
              <select
                value={margin}
                onChange={(e) => setMargin(parseInt(e.target.value))}
                className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              >
                <option value={0}>0 (Edge-to-edge)</option>
                <option value={2}>2 (Standard)</option>
                <option value={4}>4 (Comfortable)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 block mb-1">
                Correction Level
              </label>
              <select
                value={errorLevel}
                onChange={(e) => setErrorLevel(e.target.value as "L" | "M" | "Q" | "H")}
                className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              >
                <option value="L">L (7% recovery)</option>
                <option value="M">M (15% standard)</option>
                <option value="Q">Q (25% high)</option>
                <option value="H">H (30% best for logo)</option>
              </select>
            </div>
          </div>

          {/* Center Logo Picker */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
              Center Logo Watermark
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "none", label: "None" },
                { id: "website", label: "Globe" },
                { id: "whatsapp", label: "WhatsApp" },
                { id: "wifi", label: "WiFi" },
                { id: "github", label: "GitHub" },
                { id: "crypto", label: "Bitcoin" },
              ].map((lp) => (
                <button
                  key={lp.id}
                  type="button"
                  onClick={() => setLogoPreset(lp.id as LogoPreset)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    logoPreset === lp.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {lp.label}
                </button>
              ))}

              <label className="px-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer flex items-center gap-1">
                <Upload className="w-3 h-3" />
                <span>Upload Custom Logo</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Frame Style Picker */}
          <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
              Call-to-Action Frame Banner
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "none", label: "No Frame" },
                { id: "scan-me", label: "SCAN ME" },
                { id: "wifi", label: "CONNECT TO WI-FI" },
                { id: "whatsapp", label: "CHAT ON WHATSAPP" },
                { id: "custom", label: "Custom Label" },
              ].map((fs) => (
                <button
                  key={fs.id}
                  type="button"
                  onClick={() => setFrameStyle(fs.id as FrameStyle)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    frameStyle === fs.id
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {fs.label}
                </button>
              ))}
            </div>

            {frameStyle === "custom" && (
              <input
                type="text"
                value={customFrameText}
                onChange={(e) => setCustomFrameText(e.target.value)}
                placeholder="Custom Banner (e.g. FOLLOW US ON X)"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />
            )}
          </div>
        </div>
      </div>

      {/* Live Preview Column (Right) */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        {/* Canvas Display Card */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs flex flex-col items-center justify-center space-y-4">
          <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/50 shadow-inner">
            <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg shadow-sm" />
          </div>

          <div className="text-center space-y-1">
            <div className="text-xs font-mono text-zinc-500 truncate max-w-[280px]">
              {getPayload()}
            </div>
            <div className="text-[11px] text-zinc-400">
              Payload size: {getPayload().length} characters
            </div>
          </div>
        </div>

        {/* Export Controls Card */}
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <span>Export Resolution</span>
            <div className="flex items-center gap-1 font-mono text-[11px]">
              {[400, 1000, 2000].map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setExportRes(res as 400 | 1000 | 2000)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    exportRes === res
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent"
                      : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {res}px
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="py-2.5 px-3 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              Download PNG
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              className="py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              Download Vector SVG
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyImage}
            className="w-full py-2 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 text-xs font-medium hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-semibold">Copied Image to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy PNG to Clipboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
