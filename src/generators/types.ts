import React from "react";

export type ToolCategory =
  | "core"
  | "developer"
  | "design"
  | "content"
  | "productivity";

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
    description: "Most popular workstation generators",
    icon: "Sparkles",
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  developer: {
    id: "developer",
    name: "Tech & Dev",
    description: "Code, tokens, syntax, and server utilities",
    icon: "Code2",
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  design: {
    id: "design",
    name: "Design & UI",
    description: "Colors, shadows, glassmorphism, and design specs",
    icon: "Palette",
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  content: {
    id: "content",
    name: "Creative & Content",
    description: "Characters, lore, markdown tables, and SEO previews",
    icon: "PenTool",
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  productivity: {
    id: "productivity",
    name: "Productivity",
    description: "Invoices, email signatures, agendas, and everyday workflows",
    icon: "Briefcase",
    badgeColor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
};

export interface ToolMeta {
  slug: string;
  title: string;
  shortTitle?: string;
  description: string;
  category: ToolCategory;
  tags: string[];
  icon: string;
  isNew?: boolean;
  isPopular?: boolean;
  version?: string;
}

export interface GeneratorModule {
  meta: ToolMeta;
  component: React.ComponentType;
}
