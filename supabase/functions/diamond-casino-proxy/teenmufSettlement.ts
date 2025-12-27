/* =====================================================
   MUFLIS TEENPATTI Settlement
===================================================== */

export interface TeenMufResult {
  mid?: string | number;
  winnerSr: number;        // 1 | 2
  winnerName: string;      // Player A | Player B
  cards: string[];         // ["3CC","5HH","2SS","4SS","7SS","QCC"]
  rdesc?: string;          // full rdesc
}

/* ================= TABLE CHECK ================= */

export function isTeenMufTable(tableId: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase() === "teenmuf";
}

/* ================= PARSE RESULT ================= */

export function parseTeenMufResult(
  win: string,
  rdesc: string,
  cards: string,
  mid?: string | number
): TeenMufResult | null {

  const winnerSr = Number(win);
  if (!winnerSr || winnerSr < 1) return null;

  /**
   * rdesc example:
   * "Player A#A : Card 7#Player A (A : 2  |  B : 9)"
   */
  let winnerName = "";

  if (rdesc) {
    // Winner name is always first segment
    winnerName = rdesc.split("#")[0].trim();
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

export function isWinningTeenMufBet(
  bet: { sr: number },
  result: TeenMufResult
): boolean {
  return bet.sr === result.winnerSr;
}
