/* =====================================================
   TRIO Settlement
===================================================== */

export interface TrioResult {
  mid?: string | number;
  winnerSr: number;        // 0 | 1
  winnerName: string;      // Yes / No (or label from rdesc)
  cards: string[];         // ["AHH","2HH","7SS"]
  rdesc?: string;          // full rdesc
}

/* ================= TABLE CHECK ================= */

export function isTrioTable(tableId: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase() === "trio";
}

/* ================= PARSE RESULT ================= */

export function parseTrioResult(
  win: string,
  rdesc: string,
  cards: string,
  mid?: string | number
): TrioResult | null {

  if (win === undefined || win === null) return null;

  const winnerSr = Number(win);
  if (winnerSr !== 0 && winnerSr !== 1) return null;

  /**
   * rdesc example:
   * "No (10)#1 2 4#Red#Odd#"
   */
  let winnerName = "";

  if (rdesc) {
    // First segment is always result label
    winnerName = rdesc.split("#")[0].trim();
  } else {
    winnerName = winnerSr === 1 ? "Yes" : "No";
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

export function isWinningTrioBet(
  bet: { sr: number },
  result: TrioResult
): boolean {
  return bet.sr === result.winnerSr;
}
