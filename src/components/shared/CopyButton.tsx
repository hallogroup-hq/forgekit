"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import confetti from "canvas-confetti";
import { copyToClipboard } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  triggerConfetti?: boolean;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  triggerConfetti = false,
  className = "",
  variant = "secondary",
  size = "md",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      if (triggerConfetti) {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"],
        });
      }
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2",
    lg: "px-4 py-2 text-base gap-2.5",
  }[size];

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-sm",
    secondary:
      "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100",
    outline:
      "border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200",
    ghost:
      "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300",
  }[variant];

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 active:scale-95 cursor-pointer ${sizeClasses} ${variantClasses} ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-500 transition-transform scale-110" />
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 opacity-70" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
