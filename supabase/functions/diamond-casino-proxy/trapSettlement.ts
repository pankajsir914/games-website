/* =====================================================
   THE TRAP Settlement
===================================================== */

export interface TrapResult {
  mid?: string | number;
  winnerSr: number;        // 1 | 2
  winnerName: string;      // Player A | Player B
  cards: string[];         // ["8DD","ASS","ADD","10SS","6SS",...]
  rdesc?: string;          // full rdesc string
}

/* ================= TABLE CHECK ================= */

export function isTrapTable(tableId: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase() === "trap";
}

/* ================= PARSE RESULT ================= */

export function parseTrapResult(
  win: string,
  rdesc: string,
  cards: string,
  mid?: string | number
): TrapResult | null {

  const winnerSr = Number(win);
  if (!winnerSr || winnerSr < 1) return null;

  /**
   * rdesc example:
   * "Player B  (A:15, B:11)#High,Low,Low,High,Low#No,No,No,No,No"
   */
  let winnerName = "";

  if (rdesc) {
    winnerName = rdesc.split("(")[0].trim();
  }

  return {
    mid,
    winnerSr,
    winnerName,
    cards: cards ? cards.split(",") : [],
    rdesc,
  };
}

/* ================= SETTLEMENT ================= */

export function isWinningTrapBet(
  bet: { sr: number },
  result: TrapResult
): boolean {
  return bet.sr === result.winnerSr;
}
