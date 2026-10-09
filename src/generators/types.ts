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
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  "vibe-coder": {
    id: "vibe-coder",
    name: "Architecture & Prompts",
    description: "Coding system instructions, technical PRDs, and workflow prompts",
    icon: "Terminal",
    badgeColor: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  },
  developer: {
    id: "developer",
    name: "Developer & DevOps",
    description: "Webhooks, SQL schemas, Docker, and dev workflows",
    icon: "Code2",
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  design: {
    id: "design",
    name: "Design & UI/UX",
    description: "Design.md specs, mesh gradients, WCAG contrast, CSS effects",
    icon: "Palette",
    badgeColor: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  },
  content: {
    id: "content",
    name: "Content & Documents",
    description: "Markdown tables, text cleaners, and meeting agendas",
    icon: "PenTool",
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  growth: {
    id: "growth",
    name: "Marketing & Growth",
    description: "UTM links, copywriting frameworks, and email signatures",
    icon: "TrendingUp",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
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
