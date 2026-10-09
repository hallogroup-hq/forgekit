import { ToolMeta } from "../../types";

export const meta: ToolMeta = {
  slug: "hash-secret",
  title: "Hash & Secret Key Generator",
  shortTitle: "Hash & Secret",
  description: "Cryptographic hash digest calculator (SHA-256, SHA-512, SHA-384, SHA-1) and secure API token secret generator.",
  category: "developer",
  tags: ["hash", "sha256", "sha512", "sha384", "sha1", "base64", "secret", "token", "crypto", "security"],
  icon: "ShieldAlert",
  kind: "instant",
  processing: ["client"],
  acceptedInputs: ["Raw string", "Passphrase", "API seed"],
  outputs: ["Hex Digest", "Base64 Digest", "Bearer Secret", "API Key"],
  lifecycle: "ready",
  isPopular: true,
};
