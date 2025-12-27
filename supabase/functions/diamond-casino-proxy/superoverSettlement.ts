/* =====================================================
   SUPER OVER Settlement
===================================================== */

export interface SuperOverResult {
  mid?: string | number;
  winnerSr: number;        // 1 | 2
  winnerName: string;      // ENG | RSA
  cards: string[];         // ["KDD","2DD","1","1","1","1"]
  rdesc?: string;          // "ENG : 9 | RSA : 11"
}

/* ================= TABLE CHECK ================= */

export function isSuperOverTable(tableId: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase() === "superover";
}

/* ================= PARSE RESULT ================= */

export function parseSuperOverResult(
  win: string,
  rdesc: string,
  cards: string,
  mid?: string | number
): SuperOverResult | null {

  const winnerSr = Number(win);
  if (!winnerSr || winnerSr < 1) return null;

  /**
   * rdesc example:
   * "ENG : 9 | RSA : 11"
   */
  let winnerName = "";

  if (rdesc) {
    const parts = rdesc.split("|").map(p => p.trim());

    if (winnerSr === 1 && parts[0]) {
      winnerName = parts[0].split(":")[0].trim();
    }

    if (winnerSr === 2 && parts[1]) {
      winnerName = parts[1].split(":")[0].trim();
    }
  }

  return {
    mid,
    winnerSr,
    winnerName,
    cards: cards ? cards.split("|") : [],
    rdesc,
  };
}

/* ================= SETTLEMENT ================= */

export function isWinningSuperOverBet(
  bet: { sr: number },
  result: SuperOverResult
): boolean {
  return bet.sr === result.winnerSr;
}
