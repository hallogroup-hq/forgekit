"use client";

import React, { useState, useEffect, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";

export default function HashSecretGenerator() {
  const [activeTab, setActiveTab] = useState<"hash" | "secret">("hash");

  // Hash state
  const [inputString, setInputString] = useState("Hello ForgeKit!");
  const [sha256, setSha256] = useState("");
  const [sha512, setSha512] = useState("");
  const [sha1, setSha1] = useState("");
  const [base64Encoded, setBase64Encoded] = useState("");

  // Secret state
  const [secretBytes, setSecretBytes] = useState(32);
  const [secretSeed, setSecretSeed] = useState(0);

  // Compute hashes using subtle crypto
  useEffect(() => {
    async function computeHashes() {
      if (!inputString) {
        setSha256("");
        setSha512("");
        setSha1("");
        setBase64Encoded("");
        return;
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(inputString);

      // SHA-256
      const buf256 = await crypto.subtle.digest("SHA-256", data);
      setSha256(Array.from(new Uint8Array(buf256)).map((b) => b.toString(16).padStart(2, "0")).join(""));

      // SHA-512
      const buf512 = await crypto.subtle.digest("SHA-512", data);
      setSha512(Array.from(new Uint8Array(buf512)).map((b) => b.toString(16).padStart(2, "0")).join(""));

      // SHA-1
      const buf1 = await crypto.subtle.digest("SHA-1", data);
      setSha1(Array.from(new Uint8Array(buf1)).map((b) => b.toString(16).padStart(2, "0")).join(""));

      // Base64
      try {
        setBase64Encoded(btoa(inputString));
      } catch {
        setBase64Encoded(btoa(encodeURIComponent(inputString)));
      }
    }

    computeHashes();
  }, [inputString]);

  // Generate random tokens
  const generatedTokens = useMemo(() => {
    const array = new Uint8Array(secretBytes);
    if (typeof window !== "undefined" && window.crypto) {
      window.crypto.getRandomValues(array);
    }

    const hex = Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
    const base64 = btoa(String.fromCharCode(...array)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const apiKey = `fk_live_${hex.slice(0, 32)}`;

    return { hex, base64, apiKey };
  }, [secretBytes, secretSeed]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl max-w-sm">
        <button
          type="button"
          onClick={() => setActiveTab("hash")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === "hash"
              ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          Text Hasher & Digest
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("secret")}
          className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
            activeTab === "secret"
              ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          Cryptographic Secrets
        </button>
      </div>

      {activeTab === "hash" ? (
        <div className="space-y-5">
          {/* Input Box */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Input String / Payload
            </label>
            <textarea
              rows={3}
              value={inputString}
              onChange={(e) => setInputString(e.target.value)}
              placeholder="Enter text to hash..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
            />
          </div>

          {/* Results Grid */}
          <div className="space-y-3">
            {[
              { label: "SHA-256 (Standard)", value: sha256, bits: "256 bits / 64 hex chars" },
              { label: "SHA-512 (High Security)", value: sha512, bits: "512 bits / 128 hex chars" },
              { label: "SHA-1 (Legacy / Git Object)", value: sha1, bits: "160 bits / 40 hex chars" },
              { label: "Base64 Encoded", value: base64Encoded, bits: "ASCII text format" },
            ].map((item) => (
              <div
                key={item.label}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{item.bits}</span>
                </div>

                <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="font-mono text-xs text-zinc-800 dark:text-zinc-200 break-all select-all">
                    {item.value || "-"}
                  </div>
                  <CopyButton
                    text={item.value}
                    label="Copy"
                    size="sm"
                    variant="ghost"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Entropy Byte Length
              </label>
              <div className="flex items-center gap-2">
                {[16, 32, 64].map((bytes) => (
                  <button
                    key={bytes}
                    type="button"
                    onClick={() => setSecretBytes(bytes)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                      secretBytes === bytes
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {bytes} bytes ({bytes * 8} bits)
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSecretSeed((prev) => prev + 1);
                confetti({ particleCount: 20, spread: 40, origin: { y: 0.8 } });
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Secrets</span>
            </button>
          </div>

          <div className="space-y-3">
            {[
              { label: "Hex Encoded Secret (JWT HMAC)", value: generatedTokens.hex, desc: "Safe for environment variables & crypto signing" },
              { label: "Base64 URL-Safe Token", value: generatedTokens.base64, desc: "Safe for URLs, cookies, and OAuth state params" },
              { label: "Prefixed API Key Token", value: generatedTokens.apiKey, desc: "Standard Stripe / GitHub styled API secret key format" },
            ].map((token) => (
              <div
                key={token.label}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {token.label}
                  </span>
                  <span className="text-[10px] text-zinc-400">{token.desc}</span>
                </div>

                <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="font-mono text-xs text-zinc-800 dark:text-zinc-200 break-all select-all font-medium">
                    {token.value}
                  </div>
                  <CopyButton
                    text={token.value}
                    label="Copy"
                    size="sm"
                    variant="primary"
                    triggerConfetti
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
