/* =====================================================
   NOTE NUMBER Settlement
===================================================== */

export interface NoteNumResult {
  mid?: string | number;
  winnerSr: number;        // 0 | 1
  winnerName: string;      // Won / Lost (or label from rdesc)
  cards: string[];         // ["5HH","7SS","6DD","5SS","2DD","9CC"]
  rdesc?: string;          // full rdesc
}

/* ================= TABLE CHECK ================= */

export function isNoteNumTable(tableId: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase() === "notenum";
}

/* ================= PARSE RESULT ================= */

export function parseNoteNumResult(
  win: string,
  rdesc: string,
  cards: string,
  mid?: string | number
): NoteNumResult | null {

  if (win === undefined || win === null) return null;

  const winnerSr = Number(win);
  if (winnerSr !== 0 && winnerSr !== 1) return null;

  /**
   * rdesc example:
   * "Odd  Odd  Even  Odd  Even  Odd#Red  Black  Red  Black  Red  Black#Low  High  High  Low  Low  High#5  7  6  5  2  9#Baccarat 1 (B1 : 8  |  B2 : 6)"
   */
  let winnerName = "";

  if (winnerSr === 1) {
    winnerName = "Won";
  } else {
    winnerName = "Lost";
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

export function isWinningNoteNumBet(
  bet: { sr: number },
  result: NoteNumResult
): boolean {
  return bet.sr === result.winnerSr;
}
