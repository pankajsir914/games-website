import { BettingPanel } from "@/components/live-casino/BettingPanel";
import { LiveCasinoTableConfig } from "../types";

interface BetSlipProps {
  table: LiveCasinoTableConfig;
  odds: any;
  loading: boolean;
  onPlaceBet: (betData: any) => Promise<void>;
}

export const BetSlip = ({ table, odds, loading, onPlaceBet }: BetSlipProps) => {
  // Normalize table props for the existing BettingPanel to avoid UI duplication
  const bettingTable = {
    id: table.tableId,
    name: table.tableName,
    status: table.status,
    min: table.min,
    max: table.max,
  };

  return (
    <BettingPanel
      table={bettingTable}
      odds={odds}
      onPlaceBet={onPlaceBet}
      loading={loading}
    />
  );
};

