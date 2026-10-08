import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { registry, getGeneratorBySlug } from "@/generators/registry";
import { GeneratorHarness } from "@/components/shared/GeneratorHarness";
import type { Metadata } from "next";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return registry
    .filter((tool) => tool.meta.lifecycle !== "hidden")
    .map((tool) => ({
      slug: tool.meta.slug,
    }));
}

export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getGeneratorBySlug(slug);

  if (!tool || tool.meta.lifecycle === "hidden") {
    return {
      title: "Tool Not Found: ForgeKit",
    };
  }

  return {
    title: `${tool.meta.title} | ForgeKit`,
    description: tool.meta.description,
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getGeneratorBySlug(slug);

  if (!tool || tool.meta.lifecycle === "hidden") {
    notFound();
  }

  const Component = tool.component;

  return (
    <GeneratorHarness meta={tool.meta}>
      <Suspense
        fallback={
          <div className="py-16 text-center text-xs text-zinc-400">
            Initializing workstation generator...
          </div>
        }
      >
        <Component />
      </Suspense>
    </GeneratorHarness>
  );
}
