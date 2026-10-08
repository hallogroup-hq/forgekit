"use client";

import React, { useState, useMemo, useRef } from "react";
import { Check, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";

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

  const [copiedRich, setCopiedRich] = useState(false);
  const signaturePreviewRef = useRef<HTMLDivElement | null>(null);

  const rawHtml = useMemo(() => {
    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; font-size: 13px; line-height: 1.4;">
  <tr>
    <td style="padding-right: 16px; vertical-align: top;">
      <img src="${avatarUrl}" alt="${fullName}" width="68" height="68" style="border-radius: 50%; display: block; object-fit: cover;" />
    </td>
    <td style="border-left: 2px solid ${accentColor}; padding-left: 16px; vertical-align: top;">
      <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-bottom: 2px;">${fullName}</div>
      <div style="font-size: 12px; color: ${accentColor}; font-weight: 600; margin-bottom: 2px;">${jobTitle}</div>
      <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${company}</div>
      
      <div style="font-size: 11px; color: #475569; line-height: 1.6;">
        <div>📧 <a href="mailto:${email}" style="color: #475569; text-decoration: none;">${email}</a></div>
        <div>📞 <a href="tel:${phone}" style="color: #475569; text-decoration: none;">${phone}</a></div>
        <div>🌐 <a href="${website}" style="color: ${accentColor}; text-decoration: none; font-weight: 500;">${website.replace(/^https?:\/\//, "")}</a></div>
      </div>
      
      <div style="margin-top: 8px; font-size: 11px;">
        <a href="${linkedin}" style="color: ${accentColor}; text-decoration: none; font-weight: 600; margin-right: 8px;">LinkedIn</a>
        <a href="${github}" style="color: #334155; text-decoration: none; font-weight: 600;">GitHub</a>
      </div>
    </td>
  </tr>
</table>`;
  }, [fullName, jobTitle, company, email, phone, website, avatarUrl, accentColor, linkedin, github]);

  const handleCopyRichText = async () => {
    try {
      if (typeof window !== "undefined" && navigator.clipboard && window.isSecureContext) {
        const blobHtml = new Blob([rawHtml], { type: "text/html" });
        const blobText = new Blob([`${fullName}\n${jobTitle} | ${company}\n${email} | ${phone}`], { type: "text/plain" });
        await navigator.clipboard.write([new ClipboardItem({ "text/html": blobHtml, "text/plain": blobText })]);
        setCopiedRich(true);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
        setTimeout(() => setCopiedRich(false), 2500);
      }
    } catch (e) {
      console.error("Failed to copy rich HTML", e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Form (Left) */}
      <div className="lg:col-span-6 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          Signature Contact Details
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Job Title</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Company Name</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Website</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Avatar / Logo Image URL</label>
            <input
              type="text"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 mb-1 font-medium">Accent Brand Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-8 h-8 rounded border border-zinc-300 dark:border-zinc-700 cursor-pointer"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-24 px-2 py-1 text-xs font-mono rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview (Right) */}
      <div className="lg:col-span-6 space-y-5">
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            Email Signature Preview
          </span>

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
          </div>
        </div>

        {/* Email Client Mockup */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm space-y-4">
          <div className="text-xs text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div>To: client@example.com</div>
            <div>Subject: Project Update & Next Steps</div>
          </div>

          <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 py-2">
            <p>Hi Team,</p>
            <p>Looking forward to collaborating on our upcoming sprint launch. Please let me know if you need any adjustments to the deliverables.</p>
            <p>Best regards,</p>
          </div>

          {/* Rendered Signature Area */}
          <div
            ref={signaturePreviewRef}
            className="pt-4 border-t border-zinc-100 dark:border-zinc-800"
            dangerouslySetInnerHTML={{ __html: rawHtml }}
          />
        </div>
      </div>
    </div>
  );
}
