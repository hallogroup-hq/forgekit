import { ToolMeta } from "../../types";

export const meta: ToolMeta = {
  slug: "password-passphrase",
  title: "Password & Passphrase Studio",
  shortTitle: "Password Generator",
  description: "Cryptographically secure random passwords and memorable Diceware passphrases with real-time Shannon entropy analysis.",
  category: "developer",
  tags: ["password", "passphrase", "security", "crypto", "generator", "entropy", "diceware"],
  icon: "KeyRound",
  kind: "instant",
  processing: ["client"],
  acceptedInputs: ["Length (4-128)", "Character sets", "Word count (2-20)", "Separators"],
  outputs: ["CSPRNG Passwords", "Diceware Passphrases", "Entropy Bit Score"],
  lifecycle: "ready",
  isPopular: true,
};
