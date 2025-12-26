/* =====================================================
   CARD32 (32 Cards A) Settlement
===================================================== */

export type Card32Winner =
  | "Player 8"
  | "Player 9"
  | "Player 10"
  | "Player 11";

export interface Card32Result {
  winner: Card32Winner;
  cards: string[];
  rdesc?: string;
  mid?: string | number;
}

/* ================= TABLE CHECK ================= */

export function isCard32Table(tableId: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase().includes("card32");
}

/* ================= PARSE RESULT ================= */

export function parseCard32Result(
  win: string,
  card: string,
  rdesc?: string,
  mid?: string | number
): Card32Result | null {
  if (!win) return null;

  const winnerMap: Record<string, Card32Winner> = {
    "1": "Player 8",
    "2": "Player 9",
    "3": "Player 10",
    "4": "Player 11",
  };

  const winner = winnerMap[win];
  if (!winner) return null;

  const result: Card32Result = {
    winner,
    cards: card ? card.split(",") : [],
    rdesc,
    mid,
  };

  console.log("🃏 [CARD32 Parsed]", result);
  return result;
}

/* ================= MAIN BET ================= */

export function isWinningCard32Bet(
  bet: { nat: string },
  result: Card32Result
): boolean {
  return bet.nat.trim().toLowerCase() === result.winner.toLowerCase();
}

/* ================= LAST 10 FORMAT ================= */

export function formatCard32Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "P8" :
      r.win === "2" ? "P9" :
      r.win === "3" ? "P10" :
      r.win === "4" ? "P11" : "-"
  }));
}
