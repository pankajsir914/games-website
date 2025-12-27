/* =====================================================
   QUEEN GAME Settlement
===================================================== */

export interface QueenResult {
  mid?: string | number;
  winnerSr: number;      // 1 to 4
  winnerName: string;    // Total 0 | Total 1 | Total 2 | Total 3
  cards: string[];
}

/* ================= TABLE CHECK ================= */

export function isQueenTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "queen";
}

/* ================= PARSE RESULT ================= */

export function parseQueenResult(
  win: string,
  rdesc: string,
  cards: string,
  mid?: string | number
): QueenResult | null {

  const winnerSr = Number(win);
  if (![1, 2, 3, 4].includes(winnerSr)) return null;

  return {
    mid,
    winnerSr,
    winnerName: rdesc,     // "Total X"
    cards: cards.split(","),
  };
}

/* ================= MATCH SETTLEMENT ================= */

export function isWinningQueenBet(
  bet: { sr: number },
  result: QueenResult
): boolean {
  return bet.sr === result.winnerSr;
}
