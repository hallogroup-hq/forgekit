import React from "react";

export type ToolCategory =
  | "core"
  | "vibe-coder"
  | "developer"
  | "design"
  | "content"
  | "growth";

export type GeneratorKind = "instant" | "assisted" | "ai-optional";
export type ProcessingMode = "client" | "server" | "ai";
export type Lifecycle = "ready" | "qa" | "development" | "hidden";

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
  icon: string;
  badgeColor: string;
}

export const CATEGORIES: Record<ToolCategory, CategoryInfo> = {
  core: {
    id: "core",
    name: "Featured",
    description: "Flagship workstation utilities",
    icon: "Layers",
    badgeColor: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700",
  },
  "vibe-coder": {
    id: "vibe-coder",
    name: "Architecture & Prompts",
    description: "Coding system instructions, technical PRDs, and workflow prompts",
    icon: "Terminal",
    badgeColor: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700",
  },
  developer: {
    id: "developer",
    name: "Developer & DevOps",
    description: "Webhooks, SQL schemas, Docker, and dev workflows",
    icon: "Code2",
    badgeColor: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700",
  },
  design: {
    id: "design",
    name: "Design & UI/UX",
    description: "Design.md specs, mesh gradients, WCAG contrast, CSS effects",
    icon: "Palette",
    badgeColor: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700",
  },
  content: {
    id: "content",
    name: "Content & Documents",
    description: "Markdown tables, text cleaners, and meeting agendas",
    icon: "PenTool",
    badgeColor: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700",
  },
  growth: {
    id: "growth",
    name: "Marketing & Growth",
    description: "UTM links, copywriting frameworks, and email signatures",
    icon: "TrendingUp",
    badgeColor: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700",
  },
};

export interface ToolMeta {
  slug: string;
  title: string;
  shortTitle?: string;
  description: string;
  outcome?: string; // Short outcome for non-technical users
  category: ToolCategory;
  tags: string[];
  icon: string;
  kind?: GeneratorKind;
  processing?: ProcessingMode[];
  acceptedInputs?: string[];
  outputs?: string[];
  lifecycle?: Lifecycle;
  version?: string;
  isNew?: boolean;
  isPopular?: boolean;
}

export interface GeneratorModule {
  meta: ToolMeta;
  component: React.ComponentType;
}
