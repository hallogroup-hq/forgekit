"use client";

import React, { useState, useMemo, useRef } from "react";
import { Check, Sparkles, Download, Code, Eye, LayoutTemplate } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import {
  EmailSignatureData,
  SignatureLayout,
  generateEmailSignatureHtml,
  generateEmailSignaturePlainText,
} from "./engine";

export default function EmailSignatureGenerator() {
  const [fullName, setFullName] = useState("Sarah Jenkins");
  const [jobTitle, setJobTitle] = useState("Head of Product Design");
  const [company, setCompany] = useState("ForgeKit Labs Inc.");
  const [email, setEmail] = useState("sarah@forgekit.dev");
  const [phone, setPhone] = useState("+1 (555) 382-9910");
  const [website, setWebsite] = useState("https://forgekit.dev");
  const [avatarUrl, setAvatarUrl] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80");
  const [accentColor, setAccentColor] = useState("#2563eb");
  const [linkedin, setLinkedin] = useState("https://linkedin.com");
  const [github, setGithub] = useState("https://github.com");
  const [twitter, setTwitter] = useState("");
  const [layout, setLayout] = useState<SignatureLayout>("modern-split");
  const [viewTab, setViewTab] = useState<"visual" | "html">("visual");

  const [copiedRich, setCopiedRich] = useState(false);
  const signaturePreviewRef = useRef<HTMLDivElement | null>(null);

  const signatureData: EmailSignatureData = useMemo(() => ({
    fullName,
    jobTitle,
    company,
    email,
    phone,
    website,
    avatarUrl,
    accentColor,
    linkedin,
    github,
    twitter,
  }), [fullName, jobTitle, company, email, phone, website, avatarUrl, accentColor, linkedin, github, twitter]);

  const rawHtml = useMemo(() => {
    return generateEmailSignatureHtml(signatureData, layout);
  }, [signatureData, layout]);

  const plainText = useMemo(() => {
    return generateEmailSignaturePlainText(signatureData);
  }, [signatureData]);

  const handleCopyRichText = async () => {
    try {
      if (typeof window !== "undefined" && navigator.clipboard && window.isSecureContext) {
        const blobHtml = new Blob([rawHtml], { type: "text/html" });
        const blobText = new Blob([plainText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          }),
        ]);
        setCopiedRich(true);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
        setTimeout(() => setCopiedRich(false), 2500);
      }
    } catch (e) {
      console.error("Failed to copy rich HTML", e);
    }
  };

  const handleDownloadHtml = () => {
    const filename = `${fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-signature.html`;
    downloadFile(rawHtml, filename, "text/html");
    confetti({ particleCount: 20, spread: 45, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Form (Left) */}
      <div className="lg:col-span-6 space-y-4">
        {/* Layout Picker */}
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <LayoutTemplate className="w-3.5 h-3.5 text-blue-500" />
            <span>Signature Layout</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "modern-split" as const, label: "Modern Split", desc: "Avatar + Side border" },
              { id: "compact" as const, label: "Compact", desc: "Single line row" },
              { id: "corporate" as const, label: "Corporate", desc: "Header banner line" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLayout(item.id)}
                className={`p-2.5 rounded-lg text-left border transition-all ${
                  layout === item.id
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 shadow-sm"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                }`}
              >
                <div className="text-xs font-semibold">{item.label}</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            Contact & Identity Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium text-[11px]">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium text-[11px]">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium text-[11px]">Company / Org</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium text-[11px]">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium text-[11px]">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />
            </div>

            <div>
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium text-[11px]">Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium text-[11px]">Avatar / Logo Image URL</label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://... (leave empty to hide)"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-600 dark:text-zinc-400 mb-1 font-medium text-[11px]">Accent Brand Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-8 h-8 rounded border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-24 px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 pb-1 border-b border-zinc-100 dark:border-zinc-800">
            Social Profiles (Optional)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-zinc-500 mb-1 text-[11px]">LinkedIn</label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1 text-[11px]">GitHub</label>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1 text-[11px]">X / Twitter</label>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://x.com/..."
                className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview (Right) */}
      <div className="lg:col-span-6 space-y-4">
        <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
            <button
              onClick={() => setViewTab("visual")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewTab === "visual"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              onClick={() => setViewTab("html")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                viewTab === "html"
                  ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>HTML Source</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRichText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              {copiedRich ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied for Gmail/Outlook!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Copy for Email Client</span>
                </>
              )}
            </button>
            <CopyButton text={rawHtml} label="Copy HTML" size="sm" variant="secondary" />
            <button
              type="button"
              onClick={handleDownloadHtml}
              title="Download HTML file"
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View container */}
        {viewTab === "visual" ? (
          <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-4">
            <div className="text-xs text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-3 font-mono">
              <div>To: client@example.com</div>
              <div>Subject: Project Update & Next Steps</div>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 py-2">
              <p>Hi Team,</p>
              <p>Looking forward to collaborating on our upcoming launch. Please let me know if you need any adjustments to the deliverables.</p>
              <p>Best regards,</p>
            </div>

            {/* Rendered Signature Area */}
            <div
              ref={signaturePreviewRef}
              className="pt-4 border-t border-zinc-100 dark:border-zinc-800"
              dangerouslySetInnerHTML={{ __html: rawHtml }}
            />
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100 max-h-[500px] overflow-y-auto">
            <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed text-zinc-300">
              {rawHtml}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
