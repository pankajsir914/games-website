// Central place to decide per-table UI theming and betting layout selection.
// Keeps 80+ games configurable instead of hardcoding IDs across components.

export type BettingLayout =
  | "andar-bahar"
  | "teen-patti"
  | "ab3"
  | "dolidana"
  | "roulette"
  | "cards"
  | "default";

export interface TableTheme {
  gradientClass?: string; // tailwind gradient for card background
  badgeColor?: string; // tailwind classes for status badge or accents
  cover?: string; // optional cover override if table has no image
  overlayLabel?: string; // optional label to show on card
}

type CategoryKey =
  | "roulette"
  | "andar-bahar"
  | "teen-patti"
  | "cards"
  | "show"
  | "number"
  | "other";

// Explicit overrides for known tables
const TABLE_LAYOUT_MAP: Record<string, BettingLayout> = {
  dolidana: "dolidana",
  teen62: "teen-patti",
  ab3: "ab3",
  ab20: "andar-bahar",
  andarbahar: "andar-bahar",
  "andar-bahar": "andar-bahar",
  abj: "andar-bahar",
};

const THEME_OVERRIDES: Record<string, TableTheme> = {
  roulette11: { gradientClass: "from-amber-500/40 to-orange-600/40", overlayLabel: "Roulette" },
  roulette12: { gradientClass: "from-amber-500/40 to-orange-600/40", overlayLabel: "Roulette" },
  roulette13: { gradientClass: "from-amber-500/40 to-orange-600/40", overlayLabel: "Roulette" },
  teen20: { gradientClass: "from-rose-500/30 to-pink-600/30", overlayLabel: "Teen Patti" },
  teen20v1: { gradientClass: "from-rose-500/30 to-pink-600/30", overlayLabel: "Teen Patti" },
  teenunique: { gradientClass: "from-rose-500/30 to-pink-600/30", overlayLabel: "Teen Patti" },
  andarbahar: { gradientClass: "from-emerald-500/30 to-teal-600/30", overlayLabel: "Andar Bahar" },
  ab20: { gradientClass: "from-emerald-500/30 to-teal-600/30", overlayLabel: "Andar Bahar" },
  ab3: { gradientClass: "from-emerald-500/30 to-teal-600/30", overlayLabel: "Andar Bahar" },
  baccarat: { gradientClass: "from-indigo-500/30 to-purple-600/30", overlayLabel: "Baccarat" },
  baccarat2: { gradientClass: "from-indigo-500/30 to-purple-600/30", overlayLabel: "Baccarat" },
};

const FALLBACK_GRADIENTS = [
  "from-amber-500/30 to-orange-600/30",
  "from-emerald-500/30 to-teal-600/30",
  "from-violet-500/30 to-purple-600/30",
  "from-rose-500/30 to-pink-600/30",
  "from-blue-500/30 to-indigo-600/30",
  "from-cyan-500/30 to-sky-600/30",
];

const CATEGORY_THEME: Record<CategoryKey, TableTheme> = {
  roulette: { gradientClass: "from-amber-500/40 to-orange-600/40", overlayLabel: "Roulette" },
  "andar-bahar": { gradientClass: "from-emerald-500/30 to-teal-600/30", overlayLabel: "Andar Bahar" },
  "teen-patti": { gradientClass: "from-rose-500/30 to-pink-600/30", overlayLabel: "Teen Patti" },
  cards: { gradientClass: "from-indigo-500/30 to-purple-600/30", overlayLabel: "Card Table" },
  show: { gradientClass: "from-blue-500/30 to-indigo-600/30", overlayLabel: "Game Show" },
  number: { gradientClass: "from-cyan-500/30 to-sky-600/30", overlayLabel: "Numbers" },
  other: {},
};

const pickGradient = (key: string) => {
  const code = key.charCodeAt(0);
  return FALLBACK_GRADIENTS[code % FALLBACK_GRADIENTS.length];
};

// Heuristic layout detector for tables without explicit mapping
const detectLayout = (tableId: string, category?: string | null): BettingLayout => {
  const id = tableId.toLowerCase();
  const cat = category?.toLowerCase();

  if (TABLE_LAYOUT_MAP[id]) return TABLE_LAYOUT_MAP[id];
  if (cat) {
    if (cat.includes("roulette")) return "roulette";
    if (cat.includes("andar")) return "andar-bahar";
    if (cat.includes("teen")) return "teen-patti";
    if (cat.includes("card") || cat.includes("poker") || cat.includes("baccarat") || cat.includes("blackjack"))
      return "cards";
  }
  if (id.includes("andar") || id.includes("bahar")) return "andar-bahar";
  if (id.includes("teen")) return "teen-patti";
  if (id.includes("roulette")) return "roulette";
  if (id.includes("poker") || id.includes("baccarat") || id.includes("blackjack")) return "cards";
  return "default";
};

export const resolveLayout = (tableId?: string, category?: string | null): BettingLayout => {
  if (!tableId) return "default";
  return detectLayout(tableId, category);
};

const mapCategory = (category?: string | null): CategoryKey => {
  const cat = category?.toLowerCase() || "";
  if (cat.includes("roulette")) return "roulette";
  if (cat.includes("andar")) return "andar-bahar";
  if (cat.includes("teen")) return "teen-patti";
  if (cat.includes("card") || cat.includes("poker") || cat.includes("baccarat") || cat.includes("blackjack"))
    return "cards";
  if (cat.includes("show")) return "show";
  if (cat.includes("number") || cat.includes("lotto") || cat.includes("lottery")) return "number";
  return "other";
};

export const resolveTheme = (tableId?: string, tableName?: string, category?: string | null): TableTheme => {
  if (!tableId) return {};
  const id = tableId.toLowerCase();
  const override = THEME_OVERRIDES[id];
  if (override) return override;

  const catKey = mapCategory(category);
  const catTheme = CATEGORY_THEME[catKey];
  if (catTheme?.gradientClass || catTheme?.overlayLabel || catTheme?.badgeColor || catTheme?.cover) {
    return catTheme;
  }

  return {
    gradientClass: pickGradient(tableName || tableId),
  };
};

