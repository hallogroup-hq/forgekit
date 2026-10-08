import { runReferenceSiteInspectionPipeline } from "../src/lib/design-inspection/inspect-reference";

async function main() {
  console.log("=== Starting Live Reference Site Inspection Pipeline ===");
  const results = await runReferenceSiteInspectionPipeline();
  console.log("=== Inspection Pipeline Complete ===");
  console.log(`Inspected ${Object.keys(results).length} reference sites:`);
  for (const [key, ev] of Object.entries(results)) {
    console.log(`- [${key}] ${ev.name} (${ev.inspectionMethod}): ${ev.fidelityReport}`);
  }
}

main().catch((err) => {
  console.error("Pipeline failure:", err);
  process.exit(1);
});
