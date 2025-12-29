import { ComponentType } from "react";

export type GameFamily =
  | "roulette"
  | "baccarat"
  | "blackjack"
  | "andar-bahar"
  | "teen-patti"
  | "dragon-tiger"
  | "sic-bo"
  | "dice"
  | string;

export interface LiveCasinoTableConfig {
  tableId: string;
  tableName: string;
  gameFamily: GameFamily;
  gameCode?: string;
  provider?: string;
  variant?: string;
  min?: number;
  max?: number;
  status?: string;
  streamUrl?: string | null;
  uiConfig?: Record<string, any>;
}

export interface LiveCasinoTemplateProps {
  table: LiveCasinoTableConfig;
  odds: any;
  bets: any[];
  loading: boolean;
  currentResult: any;
  resultHistory: any[];
  onPlaceBet: (betData: any) => Promise<void>;
}

export interface GameFamilyRegistryEntry {
  component: ComponentType<LiveCasinoTemplateProps>;
  description?: string;
}

