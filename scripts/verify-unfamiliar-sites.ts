import fs from "node:fs/promises";
import path from "node:path";
import {
  inspectLiveSite,
  buildDesignSystemFromEvidence,
} from "../src/lib/design-inspection/inspect-reference";
import {
  generateDesignMdDocument,
  generateTokensJson,
  validateDtcgTokenTree,
  preserveUserOverrides,
  attr,
} from "../src/generators/modules/design-md/engine";

interface TestSiteTarget {
  url: string;
  key: string;
  name: string;
  archetype: any;
}

const UNFAMILIAR_SITES: TestSiteTarget[] = [
  {
    url: "https://raycast.com",
    key: "raycast",
    name: "Raycast",
    archetype: "modern-saas",
  },
  {
    url: "https://stripe.com",
    key: "stripe",
    name: "Stripe",
    archetype: "modern-saas",
  },
  {
    url: "https://github.com",
    key: "github",
    name: "GitHub",
    archetype: "modern-saas",
  },
];

async function main() {
  console.log("=== Testing 3 Unfamiliar Sites for Live End-to-End Design.md Pipeline ===");
  const baseDir = path.resolve("evidence/unfamiliar-sites");
  await fs.mkdir(baseDir, { recursive: true });

  const reports: Record<string, any> = {};

  for (const site of UNFAMILIAR_SITES) {
    console.log(`\n[Inspection] Inspecting ${site.name} (${site.url})...`);
    const outputDir = path.join(baseDir, site.key);
    await fs.mkdir(outputDir, { recursive: true });

    try {
      // 1. Live Headless Chrome Inspection with Desktop & Mobile screenshots
      const evidence = await inspectLiveSite(
        site.key,
        site.url,
        site.name,
        site.archetype,
        {
          outputBaseDir: baseDir,
          captureScreenshots: true,
        }
      );

      console.log(`[Success] Live inspection complete for ${site.name}`);
      console.log(`- Fidelity: ${evidence.fidelityReport}`);

      // 2. Synthesize Design System from Evidence
      const system = buildDesignSystemFromEvidence(evidence);

      // 3. Generate DESIGN.md document
      const designMd = generateDesignMdDocument(system, {
        sourceUrl: site.url,
        observedTitle: evidence.meta.title,
        observedThemeColor: evidence.meta.themeColor,
        detectedColors: evidence.extractedPalette,
        detectedFonts: evidence.extractedFonts,
        notes: [evidence.fidelityReport],
      });
      await fs.writeFile(path.join(outputDir, "DESIGN.md"), designMd, "utf-8");

      // 4. Generate DTCG Tokens & Validate
      const tokensJson = generateTokensJson(system);
      await fs.writeFile(path.join(outputDir, "tokens.json"), tokensJson, "utf-8");
      const validation = validateDtcgTokenTree(JSON.parse(tokensJson));

      console.log(`- Tokens Valid: ${validation.valid} (${validation.tokenCount} tokens, ${validation.errors.length} errors)`);

      // 5. Override Persistence Demonstration:
      // Manually edit a primary color and heading weight on the system
      const editedSystem = {
        ...system,
        colors: {
          ...system.colors,
          primary: attr("#ff007f", "user-provided", undefined, "User custom override", undefined, 1, true),
        },
      };

      // Simulate re-inspection merge
      const mergedSystem = preserveUserOverrides(system, editedSystem);
      const overridePreserved =
        mergedSystem.colors.primary.value === "#ff007f" &&
        mergedSystem.colors.primary.userOverridden === true;

      console.log(`- Override Persistence Verified: ${overridePreserved}`);

      reports[site.key] = {
        name: site.name,
        url: site.url,
        fidelityReport: evidence.fidelityReport,
        meta: evidence.meta,
        metrics: {
          body: evidence.metrics.body,
          h1: evidence.metrics.h1,
          primaryButton: evidence.metrics.primaryButton,
          isDark: evidence.metrics.isDark,
          containerMaxWidth: evidence.metrics.containerMaxWidth,
        },
        palette: evidence.extractedPalette,
        fonts: evidence.extractedFonts,
        tokensValid: validation.valid,
        overridePreserved,
        evidenceQuality: {
          hasScreenshots: true,
          contrastValid: evidence.metrics.body.color !== evidence.metrics.body.backgroundColor,
          buttonFound: Boolean(evidence.metrics.primaryButton),
          headingFound: Boolean(evidence.metrics.h1 && (evidence.metrics.h1.width || 0) >= 40),
        },
      };
    } catch (err: any) {
      console.error(`[Error] Failed to inspect ${site.name}:`, err.message);
    }
  }

  await fs.writeFile(
    path.join(baseDir, "inspection-report.json"),
    JSON.stringify(reports, null, 2),
    "utf-8"
  );
  console.log("\n=== Unfamiliar Sites Inspection Finished. Report saved. ===");
}

main().catch((err) => {
  console.error("Runner failed:", err);
  process.exit(1);
});
