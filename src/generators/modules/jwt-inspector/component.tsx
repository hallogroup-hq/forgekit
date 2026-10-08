"use client";

import React, { useState, useMemo } from "react";
import { Download, ShieldCheck, Clock, AlertTriangle, KeyRound, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

const SAMPLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
  "eyJzdWIiOiJ1c3JfMGExYjJjM2Q0ZSIsIm5hbWUiOiJBbGV4IFJpdmVyYSIsImVtYWlsIjoiYWxleC5yaXZlcmFAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MTI1ODkwMDAsImV4cCI6MTc5ODk4OTAwMCwiaXNzIjoiZm9yZ2VraXQtYXV0aCJ9." +
  "K9d2KqM2zFjXo8W1nP7tL3vB4yH6sA9cE0uI1oP2rT4";

export default function JwtInspectorGenerator() {
  const [tokenInput, setTokenInput] = useState(SAMPLE_JWT);
  const [mockUserId, setMockUserId] = useState("usr_dev_8899aabb");
  const [mockName, setMockName] = useState("Elena Rostova");
  const [mockEmail, setMockEmail] = useState("elena@startup.io");
  const [mockRole, setMockRole] = useState("admin");
  const [mockExpHours, setMockExpHours] = useState(24);

  // Parse current token
  const parsedToken = useMemo(() => {
    const parts = tokenInput.trim().split(".");
    if (parts.length !== 3) {
      return {
        isValid: false,
        error: "Token must contain exactly 3 dot-separated segments (header.payload.signature)",
        header: null,
        payload: null,
        signature: parts[2] || "",
        headerRaw: parts[0] || "",
        payloadRaw: parts[1] || "",
      };
    }

    try {
      const headerJson = JSON.parse(base64UrlDecode(parts[0]));
      const payloadJson = JSON.parse(base64UrlDecode(parts[1]));
      return {
        isValid: true,
        error: null,
        header: headerJson,
        payload: payloadJson,
        signature: parts[2],
        headerRaw: parts[0],
        payloadRaw: parts[1],
      };
    } catch {
      return {
        isValid: false,
        error: "Malformed base64url or invalid JSON in token segments",
        header: null,
        payload: null,
        signature: parts[2],
        headerRaw: parts[0],
        payloadRaw: parts[1],
      };
    }
  }, [tokenInput]);

  // Expiration analytics
  const expStatus = useMemo(() => {
    if (!parsedToken.payload || typeof parsedToken.payload.exp !== "number") {
      return { hasExp: false, isExpired: false, label: "No expiration claim (exp)" };
    }

    const expMs = parsedToken.payload.exp * 1000;
    const now = Date.now();
    const diffMs = expMs - now;
    const expDate = new Date(expMs).toUTCString();

    if (diffMs <= 0) {
      const agoMins = Math.round(Math.abs(diffMs) / 60000);
      return {
        hasExp: true,
        isExpired: true,
        label: `Expired ${agoMins > 1440 ? `${Math.round(agoMins / 1440)} days ago` : `${agoMins} minutes ago`} (${expDate})`,
      };
    }

    const hoursLeft = Math.round(diffMs / 3600000);
    return {
      hasExp: true,
      isExpired: false,
      label: `Valid for ~${hoursLeft} hours (${expDate})`,
    };
  }, [parsedToken]);

  const handleGenerateMock = () => {
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = nowSec + mockExpHours * 3600;

    const header = { alg: "HS256", typ: "JWT" };
    const payload = {
      sub: mockUserId,
      name: mockName,
      email: mockEmail,
      role: mockRole,
      iat: nowSec,
      exp: expSec,
      iss: "forgekit-mock-auth",
    };

    const hB64 = base64UrlEncode(JSON.stringify(header));
    const pB64 = base64UrlEncode(JSON.stringify(payload));
    const fakeSig = "c2lnbmF0dXJlX2Zvcl90ZXN0aW5nX29ubHk";

    setTokenInput(`${hB64}.${pB64}.${fakeSig}`);
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  const handleDownload = () => {
    const output = JSON.stringify(
      {
        header: parsedToken.header,
        payload: parsedToken.payload,
        signature: parsedToken.signature,
      },
      null,
      2
    );
    downloadFile(output, "jwt-decoded.json", "application/json");
    confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Input Column (Left) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Token Input Card */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-500" />
              Encoded JWT Bearer Token
            </label>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              100% Client-Side Private
            </span>
          </div>

          <textarea
            rows={7}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste your JWT token here (ey...)"
            className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none break-all leading-relaxed"
          />

          {parsedToken.error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{parsedToken.error}</span>
            </div>
          )}
        </div>

        {/* Mock Token Generator Section */}
        <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Mock JWT Generator
            </span>
            <button
              type="button"
              onClick={handleGenerateMock}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Generate Token
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">User ID (sub)</label>
              <input
                type="text"
                value={mockUserId}
                onChange={(e) => setMockUserId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">User Name</label>
              <input
                type="text"
                value={mockName}
                onChange={(e) => setMockName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">User Email</label>
              <input
                type="text"
                value={mockEmail}
                onChange={(e) => setMockEmail(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">Validity (Hours)</label>
              <input
                type="number"
                min={1}
                max={720}
                value={mockExpHours}
                onChange={(e) => setMockExpHours(Number(e.target.value) || 24)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 block mb-1">Role</label>
              <select
                value={mockRole}
                onChange={(e) => setMockRole(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950"
              >
                <option value="admin">admin</option>
                <option value="editor">editor</option>
                <option value="user">user</option>
                <option value="guest">guest</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Output Column (Right) */}
      <div className="lg:col-span-7 flex flex-col space-y-4">
        {/* Status Bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 ${
                !parsedToken.isValid
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
                  : expStatus.isExpired
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
              }`}
            >
              {expStatus.isExpired ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Expired Token
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Valid Token Format
                </>
              )}
            </span>
            <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              {expStatus.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={JSON.stringify(parsedToken.payload, null, 2)}
              label="Copy Payload"
              triggerConfetti
            />
            <button
              type="button"
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 shadow-2xs transition-colors active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>
          </div>
        </div>

        {/* Decoded Blocks */}
        <div className="space-y-4">
          {/* Header Block */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-4 shadow-2xs">
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center justify-between">
              <span>HEADER: Algorithm & Token Type</span>
              <span className="text-[10px] font-mono text-zinc-400">Segment 1</span>
            </div>
            <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto">
              {parsedToken.header
                ? JSON.stringify(parsedToken.header, null, 2)
                : "(Invalid Header)"}
            </pre>
          </div>

          {/* Payload Block */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-4 shadow-2xs">
            <div className="text-xs font-bold text-violet-600 dark:text-violet-400 mb-2 flex items-center justify-between">
              <span>PAYLOAD: Claims & Identity Data</span>
              <span className="text-[10px] font-mono text-zinc-400">Segment 2</span>
            </div>
            <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl overflow-x-auto max-h-[300px]">
              {parsedToken.payload
                ? JSON.stringify(parsedToken.payload, null, 2)
                : "(Invalid Payload)"}
            </pre>
          </div>

          {/* Signature Block */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-4 shadow-2xs">
            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-2 flex items-center justify-between">
              <span>SIGNATURE: Verification Hash</span>
              <span className="text-[10px] font-mono text-zinc-400">Segment 3</span>
            </div>
            <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl break-all">
              {parsedToken.signature || "(No signature present)"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
