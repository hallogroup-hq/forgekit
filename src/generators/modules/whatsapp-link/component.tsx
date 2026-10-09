"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  ExternalLink,
  Download,
  Code2,
  QrCode,
  MessageCircle,
  Copy,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import {
  POPULAR_COUNTRIES,
  buildWhatsappLink,
  generateHtmlButtonCode,
} from "./engine";

const PRESET_MESSAGES = [
  "Hello! I am interested in your services and would like to learn more.",
  "Hi there! Can you share the latest pricing and catalog?",
  "Hello! I would like to book an appointment or consultation.",
  "Hi! I have a question regarding my recent order.",
];

export default function WhatsappLinkGenerator() {
  const [selectedCountryCode, setSelectedCountryCode] = useState("62");
  const [phoneNumber, setPhoneNumber] = useState("812 3456 7890");
  const [message, setMessage] = useState("Hello! I found your contact and would like to get in touch.");
  const [activeTab, setActiveTab] = useState<"link" | "qr" | "embed">("link");
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedCountry = useMemo(() => {
    return (
      POPULAR_COUNTRIES.find((c) => c.code === selectedCountryCode) ||
      POPULAR_COUNTRIES[0]
    );
  }, [selectedCountryCode]);

  const linkResult = useMemo(() => {
    return buildWhatsappLink({
      countryCode: selectedCountryCode,
      phoneNumber,
      message,
    });
  }, [selectedCountryCode, phoneNumber, message]);

  const htmlSnippet = useMemo(() => {
    return generateHtmlButtonCode(linkResult.url || "https://wa.me/");
  }, [linkResult.url]);

  // Render QR Code onto Canvas
  useEffect(() => {
    if (activeTab === "qr" && qrCanvasRef.current && linkResult.url) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        linkResult.url,
        {
          width: 280,
          margin: 2,
          color: {
            dark: "#075E54",
            light: "#ffffff",
          },
          errorCorrectionLevel: "H",
        },
        (err) => {
          if (err) console.error("QR Canvas error", err);
        }
      );
    }
  }, [activeTab, linkResult.url]);

  const handleDownloadQr = () => {
    if (!qrCanvasRef.current) return;
    qrCanvasRef.current.toBlob((blob) => {
      if (blob) {
        downloadFile(blob, `whatsapp-qr-${linkResult.fullPhone}.png`, "image/png");
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
      }
    });
  };

  const handleOpenLink = () => {
    if (linkResult.url) {
      window.open(linkResult.url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Input Configuration (Left) */}
      <div className="lg:col-span-6 space-y-6">
        {/* Country & Phone Number */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block">
            Country & Phone Number
          </label>

          <div className="flex gap-2">
            {/* Country Selector */}
            <select
              value={selectedCountryCode}
              onChange={(e) => setSelectedCountryCode(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shrink-0"
            >
              {POPULAR_COUNTRIES.map((c) => (
                <option key={`${c.country}-${c.code}`} value={c.code}>
                  {c.flag} +{c.code} ({c.country})
                </option>
              ))}
            </select>

            {/* Local Phone Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={selectedCountry.placeholder}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
            <span>
              Formatted: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">+{linkResult.fullPhone || "..."}</strong>
            </span>
            <span>Leading zero is stripped automatically</span>
          </div>
        </div>

        {/* Message Template */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Pre-filled Message
            </label>
            <span className="text-[11px] text-zinc-400">
              {message.length} characters
            </span>
          </div>

          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message template or greeting..."
            className="w-full p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
              Quick Starters:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessage(preset)}
                  className="px-2.5 py-1 text-[11px] rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left truncate max-w-full"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Output Studio (Right) */}
      <div className="lg:col-span-6 space-y-6">
        {/* Output Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("link")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "link"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Direct Link</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "qr"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("embed")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === "embed"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Embed Button</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "link" && (
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 space-y-5">
            <div>
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider block mb-2">
                Generated wa.me URL
              </span>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-800 dark:text-zinc-200 break-all select-all">
                {linkResult.url || "Please enter a valid phone number"}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleOpenLink}
                disabled={!linkResult.isValid}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test & Open Chat</span>
              </button>
              <CopyButton
                text={linkResult.url}
                label="Copy Link"
                size="md"
                variant="outline"
              />
            </div>
          </div>
        )}

        {activeTab === "qr" && (
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 flex flex-col items-center justify-center space-y-5 text-center">
            <div className="p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm">
              <canvas ref={qrCanvasRef} width={280} height={280} className="rounded-lg" />
            </div>

            <p className="text-xs text-zinc-500 max-w-xs">
              Scan this QR code with any smartphone camera to launch WhatsApp immediately.
            </p>

            <button
              type="button"
              onClick={handleDownloadQr}
              disabled={!linkResult.isValid}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download QR Code (PNG)</span>
            </button>
          </div>
        )}

        {activeTab === "embed" && (
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                HTML Widget Snippet
              </span>
              <CopyButton text={htmlSnippet} label="Copy HTML" size="sm" />
            </div>

            <pre className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
              {htmlSnippet}
            </pre>

            <div className="pt-2">
              <span className="text-[11px] text-zinc-400 block mb-2">Live Button Preview:</span>
              <div
                dangerouslySetInnerHTML={{ __html: htmlSnippet }}
                className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
