import { BettingPanel } from "@/components/live-casino/BettingPanel";
import { LiveCasinoTableConfig } from "../types";

interface BetSlipProps {
  table: LiveCasinoTableConfig;
  odds: any;
  loading: boolean;
  onPlaceBet: (betData: any) => Promise<void>;
  resultHistory?: any[];
  currentResult?: any;
}

export const BetSlip = ({ table, odds, loading, onPlaceBet, resultHistory = [], currentResult }: BetSlipProps) => {
  // Debug: log what we're receiving
  console.log("🔵 BetSlip - Receiving props:", {
    hasCurrentResult: !!currentResult,
    currentResultResults: currentResult?.results?.length,
    resultHistoryLength: resultHistory?.length,
    tableId: table?.tableId
  });

  // Normalize table props for the existing BettingPanel to avoid UI duplication
  const bettingTable = {
    id: table.tableId,
    name: table.tableName,
    status: table.status,
    min: table.min,
    max: table.max,
  };

  // Extract resultHistory from currentResult.results if resultHistory is empty
  const finalResultHistory = (() => {
    if (Array.isArray(resultHistory) && resultHistory.length > 0) {
      console.log("🔵 BetSlip - Using resultHistory array, length:", resultHistory.length);
      return resultHistory;
    }
    if (currentResult?.results && Array.isArray(currentResult.results) && currentResult.results.length > 0) {
      console.log("🔵 BetSlip - Using currentResult.results, length:", currentResult.results.length);
      return currentResult.results;
    }
    console.log("🔵 BetSlip - No results found, returning empty array");
    return [];
  })();

  return (
    <BettingPanel
      table={bettingTable}
      odds={odds}
      onPlaceBet={onPlaceBet}
      loading={loading}
      resultHistory={finalResultHistory}
      currentResult={currentResult}
    />
  );
};

