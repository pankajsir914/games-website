/* =====================================================
   RACE TO 17 Settlement
===================================================== */

export interface Race17Result {
  mid?: string | number;
  winnerSr: number;        // 0 | 1
  winnerName: string;      // Yes / No (or label from rdesc)
  cards: string[];         // ["KHH","3DD","2DD","JCC","9CC"]
  rdesc?: string;          // full rdesc
}

/* ================= TABLE CHECK ================= */

export function isRace17Table(tableId: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase() === "race17";
}

/* ================= PARSE RESULT ================= */

export function parseRace17Result(
  win: string,
  rdesc: string,
  cards: string,
  mid?: string | number
): Race17Result | null {

  // race17 me win = "0" | "1"
  if (win === undefined || win === null) return null;

  const winnerSr = Number(win);
  if (winnerSr !== 0 && winnerSr !== 1) return null;

  /**
   * rdesc example:
   * "No (14)#Small  Small  Small  Small  Big#Yes  No  No  Yes  No#Yes"
   */
  let winnerName = "";

  if (rdesc) {
    // First segment is always the winning label
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

export function isWinningRace17Bet(
  bet: { sr: number },
  result: Race17Result
): boolean {
  return bet.sr === result.winnerSr;
}
