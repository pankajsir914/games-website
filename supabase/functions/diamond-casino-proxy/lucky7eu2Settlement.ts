/* =====================================================
   LUCKY 7 EU2 Settlement
===================================================== */

export interface Lucky7EU2Result {
  mid?: string | number;
  winnerSr: number;
  winnerName: string;
  cards: string[];
  rdesc?: string;
}

/* ================= TABLE CHECK ================= */

export function isLucky7EU2Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "lucky7eu2";
}

/* ================= PARSE RESULT ================= */

export function parseLucky7EU2Result(
  win: string,
  rdesc: string,
  cards: string,
  mid?: string | number
): Lucky7EU2Result | null {

  const winnerSr = Number(win);
  if (!winnerSr || winnerSr < 1) return null;

  const winnerName = rdesc?.split("#")[0] || "";

  return {
    mid,
    winnerSr,
    winnerName,
    cards: cards.split(","),
    rdesc,
  };
}

/* ================= SETTLEMENT ================= */

export function isWinningLucky7EU2Bet(
  bet: { sr: number },
  result: Lucky7EU2Result
): boolean {
  return bet.sr === result.winnerSr;
}
