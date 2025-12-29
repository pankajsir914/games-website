import { GameFamilyRegistryEntry } from "../types";
import { RouletteTemplate } from "../ui-templates/roulette/RouletteTemplate";
import { AndarBaharTemplate } from "../ui-templates/andar-bahar/AndarBaharTemplate";
import { TeenPattiTemplate } from "../ui-templates/teen-patti/TeenPattiTemplate";
import { DragonTigerTemplate } from "../ui-templates/dragon-tiger/DragonTigerTemplate";
import { PokerTemplate } from "../ui-templates/poker/PokerTemplate";
import { LuckyTemplate } from "../ui-templates/lucky/LuckyTemplate";
import { BaccaratTemplate } from "../ui-templates/baccarat/BaccaratTemplate";
import { BlackjackTemplate } from "../ui-templates/blackjack/BlackjackTemplate";
import { SicBoTemplate } from "../ui-templates/sic-bo/SicBoTemplate";
import { FallbackTemplate } from "../ui-templates/FallbackTemplate";

export const GAME_FAMILY_REGISTRY: Record<string, GameFamilyRegistryEntry> = {
  roulette: {
    component: RouletteTemplate,
    description: "Standard single/auto roulette layout with wheel + betting grid",
  },
  "andar-bahar": {
    component: AndarBaharTemplate,
    description: "Andar Bahar layout with two sides and fast rounds",
  },
  "teen-patti": {
    component: TeenPattiTemplate,
    description: "Teen Patti layout with player/boot info and history",
  },
  "dragon-tiger": {
    component: DragonTigerTemplate,
    description: "Dragon Tiger layout with two-card comparison and streaks",
  },
  poker: {
    component: PokerTemplate,
    description: "Poker layout leveraging shared bet slip and history",
  },
  lucky: {
    component: LuckyTemplate,
    description: "Lucky-style games (e.g., Lucky 7) with quick rounds",
  },
  baccarat: {
    component: BaccaratTemplate,
    description: "Baccarat layout with Player/Banker/Tie focus",
  },
  blackjack: {
    component: BlackjackTemplate,
    description: "Blackjack layout with hand/round timer and bets",
  },
  "sic-bo": {
    component: SicBoTemplate,
    description: "Sic Bo / dice layout with fast rounds",
  },
  default: {
    component: FallbackTemplate,
    description: "Generic layout used until a dedicated family template is added",
  },
};

export const resolveGameFamilyComponent = (family?: string) => {
  if (!family) return GAME_FAMILY_REGISTRY.default.component;
  const key = family.toLowerCase();
  return (GAME_FAMILY_REGISTRY[key] || GAME_FAMILY_REGISTRY.default).component;
};

