"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Download, Wifi, Link as LinkIcon, Contact, Mail, FileText, Check, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { downloadFile } from "@/lib/utils";

type QrType = "url" | "wifi" | "vcard" | "text" | "email";

export default function QrCodeGenerator() {
  const [type, setType] = useState<QrType>("url");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // General fields
  const [url, setUrl] = useState("https://example.com");
  const [text, setText] = useState("Hello from ForgeKit!");

  // WiFi fields
  const [ssid, setSsid] = useState("MyHomeWiFi");
  const [wifiPassword, setWifiPassword] = useState("SecretPassword123");
  const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [wifiHidden, setWifiHidden] = useState(false);

  // vCard fields
  const [vcardName, setVcardName] = useState("Alex Johnson");
  const [vcardPhone, setVcardPhone] = useState("+1 555 123 4567");
  const [vcardEmail, setVcardEmail] = useState("alex@example.com");
  const [vcardOrg, setVcardOrg] = useState("Acme Labs");
  const [vcardTitle, setVcardTitle] = useState("Lead Architect");

  // Email fields
  const [emailTo, setEmailTo] = useState("contact@example.com");
  const [emailSubject, setEmailSubject] = useState("Project Inquiry");
  const [emailBody, setEmailBody] = useState("Hi,\n\nI would like to discuss a new project with you.");

  // Styling & Options
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [margin, setMargin] = useState(2);
  const [size, setSize] = useState(320);
  const [copied, setCopied] = useState(false);

  // Generate payload string
  const getPayload = (): string => {
    switch (type) {
      case "url":
        return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
      case "wifi":
        return `WIFI:T:${wifiEncryption};S:${ssid};P:${wifiPassword};H:${wifiHidden};;`;
      case "vcard":
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardName}\nORG:${vcardOrg}\nTITLE:${vcardTitle}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nEND:VCARD`;
      case "email":
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case "text":
      default:
        return text;
    }
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const payload = getPayload();
    if (!payload.trim()) return;

    QRCode.toCanvas(canvasRef.current, payload, {
      width: size,
      margin,
      color: {
        dark: fgColor,
        light: bgColor,
      },
      errorCorrectionLevel: errorLevel,
    }).catch((err) => console.error("QR Code Error:", err));
  }, [type, url, text, ssid, wifiPassword, wifiEncryption, wifiHidden, vcardName, vcardPhone, vcardEmail, vcardOrg, vcardTitle, emailTo, emailSubject, emailBody, fgColor, bgColor, errorLevel, margin, size]);

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        downloadFile(blob, `qrcode-${type}-${Date.now()}.png`, "image/png");
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
      }
    });
  };

  const handleDownloadSvg = async () => {
    const payload = getPayload();
    try {
      const svgString = await QRCode.toString(payload, {
        type: "svg",
        margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorLevel,
      });
      downloadFile(svgString, `qrcode-${type}-${Date.now()}.svg`, "image/svg+xml");
      confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
    } catch (e) {
      console.error(e);
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
      {/* Configuration Panel (Left) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Type selector tabs */}
        <div>
          <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Payload Type
          </label>
          <div className="grid grid-cols-5 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            {[
              { id: "url", label: "URL", icon: LinkIcon },
              { id: "wifi", label: "WiFi", icon: Wifi },
              { id: "vcard", label: "Contact", icon: Contact },
              { id: "email", label: "Email", icon: Mail },
              { id: "text", label: "Text", icon: FileText },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = type === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setType(tab.id as QrType)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Inputs */}
        <div className="space-y-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          {type === "url" && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Target Website / URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {type === "wifi" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Network SSID (WiFi Name)
                </label>
                <input
                  type="text"
                  value={ssid}
                  onChange={(e) => setSsid(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Password
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Security Type
                  </label>
                  <select
                    value={wifiEncryption}
                    onChange={(e) => setWifiEncryption(e.target.value as "WPA" | "WEP" | "nopass")}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open Network)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="wifiHidden"
                    checked={wifiHidden}
                    onChange={(e) => setWifiHidden(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="wifiHidden" className="text-xs text-zinc-600 dark:text-zinc-400">
                    Hidden Network
                  </label>
                </div>
              </div>
            </div>
          )}

          {type === "vcard" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={vcardName}
                  onChange={(e) => setVcardName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={vcardPhone}
                  onChange={(e) => setVcardPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={vcardEmail}
                  onChange={(e) => setVcardEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Organization / Company
                </label>
                <input
                  type="text"
                  value={vcardOrg}
                  onChange={(e) => setVcardOrg(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={vcardTitle}
                  onChange={(e) => setVcardTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
            </div>
          )}

          {type === "email" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email Body
                </label>
                <textarea
                  rows={3}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                />
              </div>
            </div>
          )}

          {type === "text" && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Plain Text Content
              </label>
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
          )}
        </div>

        {/* Customization Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Foreground Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-9 h-9 p-0.5 rounded cursor-pointer border border-zinc-300 dark:border-zinc-700 bg-transparent"
              />
              <input
                type="text"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-24 px-2 py-1 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Background Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-9 h-9 p-0.5 rounded cursor-pointer border border-zinc-300 dark:border-zinc-700 bg-transparent"
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-24 px-2 py-1 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Error Correction Level
            </label>
            <select
              value={errorLevel}
              onChange={(e) => setErrorLevel(e.target.value as "L" | "M" | "Q" | "H")}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
            >
              <option value="L">Low (7% recovery)</option>
              <option value="M">Medium (15% recovery)</option>
              <option value="Q">Quartile (25% recovery)</option>
              <option value="H">High (30% recovery)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex justify-between">
              <span>Quiet Zone (Margin)</span>
              <span className="font-mono text-zinc-400">{margin}</span>
            </label>
            <input
              type="range"
              min="0"
              max="8"
              value={margin}
              onChange={(e) => setMargin(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Live Preview & Actions (Right) */}
      <div className="lg:col-span-5 flex flex-col items-center justify-between p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800">
        <div className="w-full flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-500">
          <span className="font-semibold uppercase tracking-wider">Live Preview</span>
          <span className="font-mono">{size}x{size}px</span>
        </div>

        {/* Canvas wrapper */}
        <div className="my-8 p-4 rounded-2xl bg-white shadow-md border border-zinc-200/80 flex items-center justify-center">
          <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg" />
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs sm:text-sm shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadSvg}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white font-medium text-xs sm:text-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download SVG</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyImage}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-medium transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Copy Image to Clipboard</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
