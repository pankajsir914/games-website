/* =====================================================
   20-20 TEENPATTI B Settlement
===================================================== */

export interface Teen20BResult {
  mid?: string | number;
  winnerSr: number;        // 1 | 2
  winnerName: string;      // Player A | Player B
  cards: string[];         // ["9SS","QSS","7CC","2CC","9CC","JSS"]
  rdesc?: string;          // full rdesc
}

/* ================= TABLE CHECK ================= */

export function isTeen20BTable(tableId: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase() === "teen20b";
}

/* ================= PARSE RESULT ================= */

export function parseTeen20BResult(
  win: string,
  rdesc: string,
  cards: string,
  mid?: string | number
): Teen20BResult | null {

  const winnerSr = Number(win);
  if (!winnerSr || winnerSr < 1) return null;

  /**
   * rdesc example:
   * "Player A#Player A(High Baccarat)~(A : 5 | B : 2)#Tie (A : 25 | B : 25)#A : Pair#A : Black | B : Black"
   */
  let winnerName = "";

  if (rdesc) {
    // Always first segment is winner name
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

export function isWinningTeen20BBet(
  bet: { sr: number },
  result: Teen20BResult
): boolean {
  return bet.sr === result.winnerSr;
}
