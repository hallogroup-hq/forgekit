"use client";

import React, { useState, useMemo } from "react";
import { Download, ShieldCheck, Terminal, FileCode, Layers, FileText } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";
import {
  StackType,
  STACK_DEFINITIONS,
  generateDockerfile,
  generateGitignore,
  generateDockerignore,
  generateDockerCompose,
} from "./engine";

type TabMode = "dockerfile" | "gitignore" | "dockerignore" | "compose";

export default function DockerGitignoreGenerator() {
  const [selectedStack, setSelectedStack] = useState<StackType>("nextjs");
  const [activeTab, setActiveTab] = useState<TabMode>("dockerfile");
  const [customPort, setCustomPort] = useState<number>(STACK_DEFINITIONS.nextjs.defaultPort);
  const [nonRoot, setNonRoot] = useState<boolean>(true);

  const handleSelectStack = (key: StackType) => {
    setSelectedStack(key);
    setCustomPort(STACK_DEFINITIONS[key].defaultPort);
  };

  const activeContent = useMemo(() => {
    switch (activeTab) {
      case "dockerfile":
        return generateDockerfile(selectedStack, { port: customPort, nonRoot });
      case "gitignore":
        return generateGitignore(selectedStack);
      case "dockerignore":
        return generateDockerignore(selectedStack);
      case "compose":
        return generateDockerCompose(selectedStack, "app", customPort);
    }
  }, [selectedStack, activeTab, customPort, nonRoot]);

  const activeFilename = useMemo(() => {
    switch (activeTab) {
      case "dockerfile":
        return "Dockerfile";
      case "gitignore":
        return ".gitignore";
      case "dockerignore":
        return ".dockerignore";
      case "compose":
        return "docker-compose.yml";
    }
  }, [activeTab]);

  const handleDownload = () => {
    downloadFile(activeContent, activeFilename, "text/plain");
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.8 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Tech Stack Selector (Left) */}
      <div className="lg:col-span-4 space-y-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
          Choose Framework & Language
        </label>

        <div className="space-y-2">
          {(Object.keys(STACK_DEFINITIONS) as StackType[]).map((key) => {
            const stack = STACK_DEFINITIONS[key];
            const isSelected = selectedStack === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectStack(key)}
                className={`w-full p-3.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-2xs"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="font-semibold text-xs">{stack.name}</div>
                <div className={`text-[10px] mt-0.5 ${isSelected ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-500"}`}>
                  {stack.badge} • Default Port {stack.defaultPort}
                </div>
              </button>
            );
          })}
        </div>

        {/* Configuration options */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-3">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
            Container Settings
          </label>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Exposed Port</span>
            <input
              type="number"
              value={customPort}
              onChange={(e) => setCustomPort(Number(e.target.value) || 3000)}
              className="w-20 px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-right"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">Non-Root User (Security)</span>
            <input
              type="checkbox"
              checked={nonRoot}
              onChange={(e) => setNonRoot(e.target.checked)}
              className="rounded accent-zinc-900 dark:accent-zinc-100 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-500"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Built-in Best Practices</span>
          </div>
          <ul className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-1 list-disc list-inside">
            <li>Multi-stage layer caching for minimal image sizes</li>
            <li>Runs as unprivileged non-root user</li>
            <li>Slim Alpine / Distroless base images</li>
            <li>Separation of build-time and runtime assets</li>
          </ul>
        </div>
      </div>

      {/* Code Display (Right) */}
      <div className="lg:col-span-8 flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/60 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "dockerfile", label: "Dockerfile", icon: Terminal },
              { id: "gitignore", label: ".gitignore", icon: FileCode },
              { id: "dockerignore", label: ".dockerignore", icon: FileText },
              { id: "compose", label: "compose.yml", icon: Layers },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabMode)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <CopyButton
              text={activeContent}
              label={`Copy ${activeFilename}`}
              size="sm"
              variant="secondary"
              triggerConfetti
            />
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-medium shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 max-h-[520px] overflow-y-auto">
          <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 whitespace-pre selection:bg-zinc-200 dark:selection:bg-zinc-800 leading-relaxed">
            {activeContent}
          </pre>
        </div>
      </div>
    </div>
  );
}
