"use client";

import React, { useState } from "react";
import { Dices, Download, Shield, Zap, BookOpen, Heart, Eye } from "lucide-react";
import confetti from "canvas-confetti";
import { CopyButton } from "@/components/shared/CopyButton";
import { downloadFile } from "@/lib/utils";

interface CharacterData {
  name: string;
  genre: string;
  archetype: string;
  species: string;
  alignment: string;
  background: string;
  motivation: string;
  flaw: string;
  trait: string;
  quote: string;
  stats: {
    strength: number;
    agility: number;
    intellect: number;
    willpower: number;
    charisma: number;
  };
}

const FIRST_NAMES: Record<string, string[]> = {
  Fantasy: ["Valerius", "Aeloria", "Eldrin", "Lyra", "Kaelen", "Morwen", "Thorin", "Seraphina", "Drakon", "Rowan"],
  Cyberpunk: ["Kael", "Nyx", "Jax", "Vesper", "Cipher", "Nova", "Raven", "Zero", "Echo", "Hex"],
  SciFi: ["Orion", "Talia", "Corvus", "Astraea", "Vance", "Lyra", "Dax", "Soren", "Elaris", "Zane"],
};

const LAST_NAMES: Record<string, string[]> = {
  Fantasy: ["Shadoweaver", "Stormrider", "Ironheart", "Whisperwind", "Silverthorn", "Drakeblood", "Dawnseeker"],
  Cyberpunk: ["Vance", "Kovacs", "Steel", "Cross", "Mercer", "Blackwood", "Night", "Vektor", "Nexus"],
  SciFi: ["Solaris", "Vanguard", "Starlight", "Armstrong", "Nebula", "Kronos", "Helios", "Polaris"],
};

const ARCHETYPES: Record<string, string[]> = {
  Fantasy: ["Arcane Spellblade", "Rogue Infiltrator", "Holy Paladin", "Ranger Tracker", "Alchemist Sage", "Berserker Barbarian"],
  Cyberpunk: ["Netrunner Prodigy", "Street Samurai", "Corp Fixer", "Underground Bio-Hacker", "Drone Operator", "Smuggler"],
  SciFi: ["Starship Navigator", "Xeno-Biologist", "Cosmic Bounty Hunter", "Cybernetic Engineer", "Diplomatic Envoy"],
};

const SPECIES: Record<string, string[]> = {
  Fantasy: ["High Elf", "Mountain Dwarf", "Human Outlander", "Tiefling Rogue", "Celestial Aasimar", "Dragonborn"],
  Cyberpunk: ["Augmented Human", "Cyborg Hybrid", "Synthetic Android", "Bio-Engineered Clone", "Pure Human"],
  SciFi: ["Terran Human", "Centaurian Hybrid", "Silicon-Based AI", "Proxima Martian", "Ancient Android"],
};

const MOTIVATIONS = [
  "Avenge the fallen mentor whose secrets remain hidden",
  "Uncover the forbidden relic before the shadow syndicate strikes",
  "Protect an innocent sibling across hostile frontiers",
  "Redeem a shameful betrayal that cost everything",
  "Acquire forbidden knowledge to cure a terminal curse",
  "Break free from a binding corporate indenture contract",
];

const FLAWS = [
  "Chronic recklessness when adrenaline surges",
  "Deep distrust of anyone offering unearned charity",
  "Haunted by insomnia and vivid recurring nightmares",
  "Compulsive gambler when faced with impossible odds",
  "Arrogant belief in absolute self-reliance",
  "Cannot refuse a wager or high-stakes challenge",
];

const TRAITS = [
  "Speaks in quiet, measured whispers even under fire",
  "Always inspects doorways before entering any room",
  "Keeps a worn silver coin as an obsessive tactile anchor",
  "Possesses an uncanny photographic memory for maps & faces",
  "Unnaturally sharp instincts for detecting spoken lies",
];

const QUOTES = [
  "\"The shadows don't conceal me. I am the reason people fear the dark.\"",
  "\"Rules are simply suggestions written by people who survived without ambition.\"",
  "\"Trust is expensive. I only trade in hard currency and direct leverage.\"",
  "\"If the world is burning, make sure you hold the torch with purpose.\"",
  "\"Courage isn't the absence of fear, it's moving forward regardless.\"",
];

const DEFAULT_CHARACTER: CharacterData = {
  name: "Valerius Shadoweaver",
  genre: "Fantasy",
  archetype: "Arcane Spellblade",
  species: "High Elf",
  alignment: "Chaotic Good",
  background: "Raised on the perilous edges of civilization, surviving through instinct, wits, and unmatched resolve. Known across regions as both an indispensable ally and an unpredictable wild card.",
  motivation: "Avenge the fallen mentor whose secrets remain hidden",
  flaw: "Chronic recklessness when adrenaline surges",
  trait: "Speaks in quiet, measured whispers even under fire",
  quote: "\"The shadows don't conceal me. I am the reason people fear the dark.\"",
  stats: {
    strength: 16,
    agility: 18,
    intellect: 15,
    willpower: 14,
    charisma: 17,
  },
};

export default function CharacterGenerator() {
  const [genre, setGenre] = useState<"Fantasy" | "Cyberpunk" | "SciFi">("Fantasy");

  const generateRandomCharacter = (targetGenre: "Fantasy" | "Cyberpunk" | "SciFi"): CharacterData => {
    const firstNames = FIRST_NAMES[targetGenre];
    const lastNames = LAST_NAMES[targetGenre];
    const archetypes = ARCHETYPES[targetGenre];
    const speciesList = SPECIES[targetGenre];

    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const rollStat = () => Math.floor(Math.random() * 8) + 12; // 12 to 19

    return {
      name: `${pick(firstNames)} ${pick(lastNames)}`,
      genre: targetGenre,
      archetype: pick(archetypes),
      species: pick(speciesList),
      alignment: pick(["Lawful Good", "Chaotic Good", "True Neutral", "Chaotic Neutral", "Lawful Neutral"]),
      background: `Raised on the perilous edges of civilization, surviving through instinct, wits, and unmatched resolve. Known across regions as both an indispensable ally and an unpredictable wild card.`,
      motivation: pick(MOTIVATIONS),
      flaw: pick(FLAWS),
      trait: pick(TRAITS),
      quote: pick(QUOTES),
      stats: {
        strength: rollStat(),
        agility: rollStat(),
        intellect: rollStat(),
        willpower: rollStat(),
        charisma: rollStat(),
      },
    };
  };

  const [char, setChar] = useState<CharacterData>(DEFAULT_CHARACTER);

  const handleRandomize = () => {
    setChar(generateRandomCharacter(genre));
    confetti({ particleCount: 20, spread: 40, origin: { y: 0.7 } });
  };

  const handleGenreChange = (newGenre: "Fantasy" | "Cyberpunk" | "SciFi") => {
    setGenre(newGenre);
    setChar(generateRandomCharacter(newGenre));
  };

  const markdownSheet = `# Character Sheet: ${char.name}
**Genre:** ${char.genre} | **Species:** ${char.species} | **Archetype:** ${char.archetype}  
**Alignment:** ${char.alignment}

> ${char.quote}

---

## Attributes (Base 20 Scale)
- **Strength (STR):** ${char.stats.strength} / 20
- **Agility (AGI):** ${char.stats.agility} / 20
- **Intellect (INT):** ${char.stats.intellect} / 20
- **Willpower (WIL):** ${char.stats.willpower} / 20
- **Charisma (CHA):** ${char.stats.charisma} / 20

---

## Narrative Profile
- **Core Motivation:** ${char.motivation}
- **Fatal Flaw:** ${char.flaw}
- **Distinctive Trait:** ${char.trait}
- **Background Summary:** ${char.background}

*Generated via ForgeKit Character Studio*
`;

  const handleDownloadJson = () => {
    downloadFile(JSON.stringify(char, null, 2), `${char.name.toLowerCase().replace(/\s+/g, "-")}.json`, "application/json");
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-2">
            Universe:
          </span>
          {(["Fantasy", "Cyberpunk", "SciFi"] as const).map((g) => (
            <button
              key={g}
              onClick={() => handleGenreChange(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                genre === g
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Dices className="w-4 h-4" />
            <span>Roll New Character</span>
          </button>
          <CopyButton
            text={markdownSheet}
            label="Copy Sheet"
            size="sm"
            variant="secondary"
            triggerConfetti
          />
          <button
            onClick={handleDownloadJson}
            title="Download JSON Card"
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Character Sheet Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 md:p-8 shadow-sm space-y-6">
        {/* Header Profile */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                {char.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                {char.archetype}
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {char.species} • {char.alignment} • {char.genre}
            </p>
          </div>

          <div className="italic text-xs md:text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-md">
            {char.quote}
          </div>
        </div>

        {/* Stat Bars & Radar Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Core Attributes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Strength", value: char.stats.strength, icon: Shield, color: "bg-red-500" },
              { label: "Agility", value: char.stats.agility, icon: Zap, color: "bg-amber-500" },
              { label: "Intellect", value: char.stats.intellect, icon: BookOpen, color: "bg-blue-500" },
              { label: "Willpower", value: char.stats.willpower, icon: Heart, color: "bg-emerald-500" },
              { label: "Charisma", value: char.stats.charisma, icon: Eye, color: "bg-purple-500" },
            ].map((stat) => {
              const IconComp = stat.icon;
              const percent = (stat.value / 20) * 100;
              return (
                <div
                  key={stat.label}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                      <IconComp className="w-3 h-3 opacity-60" />
                      {stat.label}
                    </span>
                    <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {stat.value}/20
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stat.color} transition-all duration-300`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Narrative Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Core Motivation
            </span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
              {char.motivation}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Fatal Flaw
            </span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
              {char.flaw}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Distinctive Trait
            </span>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
              {char.trait}
            </p>
          </div>
        </div>

        {/* Background Summary */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Background Lore
          </span>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {char.background}
          </p>
        </div>
      </div>
    </div>
  );
}
