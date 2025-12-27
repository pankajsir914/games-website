/* =====================================================
   RACE 20 Settlement
===================================================== */

export interface Race20Result {
  mid?: string | number;
  winnerSr: number;        // 1 to 4
  winnerName: string;      // K of spade | heart | club | diamond
  totalPoints?: number;
  totalCards?: number;
  cards: string[];
}

/* ================= TABLE CHECK ================= */

export function isRace20Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "race20";
}

/* ================= PARSE RESULT ================= */

export function parseRace20Result(
  win: string,
  rdesc: string,
  cards: string,
  mid?: string | number
): Race20Result | null {

  const winnerSr = Number(win);
  if (![1, 2, 3, 4].includes(winnerSr)) return null;

  const parts = rdesc?.split("#") || [];
  const winnerName = parts[0] || "";

  const totalPoints = parts[1] ? Number(parts[1]) : undefined;
  const totalCards = parts[2] ? Number(parts[2]) : undefined;

  return {
    mid,
    winnerSr,
    winnerName,
    totalPoints,
    totalCards,
    cards: cards.split(","),
  };
}

/* ================= MATCH SETTLEMENT ================= */

export function isWinningRace20Bet(
  bet: { sr: number },
  result: Race20Result
): boolean {
  return bet.sr === result.winnerSr;
}
