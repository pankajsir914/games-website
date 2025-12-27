/* =====================================================
   TEENSIN (29 Card Baccarat) Settlement
===================================================== */

export interface TeenSinResult {
  mid?: string | number;
  winnerSr: number;        // 1 | 2
  winnerName: string;      // Player A | Player B
  cards: string[];         // ["5DD","5CC","7DD","6HH","8DD","7CC"]
  rdesc?: string;          // full rdesc string
}

/* ================= TABLE CHECK ================= */

export function isTeenSinTable(tableId: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase() === "teensin";
}

/* ================= PARSE RESULT ================= */

export function parseTeenSinResult(
  win: string,
  rdesc: string,
  cards: string,
  mid?: string | number
): TeenSinResult | null {

  const winnerSr = Number(win);
  if (!winnerSr || winnerSr < 1) return null;

  /**
   * rdesc example:
   * "Player B  (A: 0 | B: 8)#Player A#-#A : Flush  |  B : Straight#No"
   */
  let winnerName = "";

  if (rdesc) {
    // Always winner name is before first "("
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

export function isWinningTeenSinBet(
  bet: { sr: number },
  result: TeenSinResult
): boolean {
  return bet.sr === result.winnerSr;
}
