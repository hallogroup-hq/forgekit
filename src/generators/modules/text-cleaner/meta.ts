import { ToolMeta } from "../../types";

export const meta: ToolMeta = {
  slug: "text-cleaner",
  title: "Text Cleaner & Case Formatter",
  shortTitle: "Text Cleaner",
  description: "Normalize broken whitespace, remove empty lines and duplicates, convert casing, and compute word/reading metrics instantly.",
  category: "content",
  tags: ["text", "cleaner", "whitespace", "case", "titlecase", "sentence", "camelcase", "dedupe", "words", "counter"],
  icon: "AlignLeft",
  kind: "instant",
  processing: ["client"],
  acceptedInputs: ["Raw text", "Pasted PDF/Email excerpt", "Line lists"],
  outputs: ["Normalized text", "Case converted text", "Cleaned TXT download", "Word/character stats"],
  lifecycle: "ready",
  isPopular: true,
  isNew: true,
};
