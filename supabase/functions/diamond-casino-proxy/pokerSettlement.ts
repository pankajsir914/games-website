/* =====================================================
   POKER (Poker 1-Day) Settlement
===================================================== */

/* ================= TYPES ================= */

export interface PokerResult {
  winnerId: number;          // 1 | 2
  winnerName: "Player A" | "Player B";
  cards: string[];           // 9 cards
  rdesc?: string;
}

/* ================= TABLE CHECK ================= */

export function isPokerTable(tableId: string): boolean {
  if (!tableId) return false;
  const t = tableId.toLowerCase();
  return t === "poker" || t.includes("poker");
}

/* ================= PARSE RESULT ================= */

export function parsePokerResult(
  win: string,
  card: string,
  rdesc?: string
): PokerResult | null {
  if (!win) return null;

  const winnerId = Number(win);

  const winnerName =
    winnerId === 1 ? "Player A" :
    winnerId === 2 ? "Player B" :
    null;

  if (!winnerName) return null;

  const result: PokerResult = {
    winnerId,
    winnerName,
    cards: card ? card.split(",") : [],
    rdesc,
  };

  console.log("🂡 [POKER Parsed]", result);
  return result;
}

/* ================= MAIN MATCH BET ================= */

export function isWinningPokerMainBet(
  bet: { nat: string },
  result: PokerResult
): boolean {
  return bet.nat.toLowerCase() === result.winnerName.toLowerCase();
}

/* ================= BONUS BETS ================= */
/**
 * NOTE:
 * Upstream API does NOT provide bonus result details.
 * rdesc shows "-" for bonus fields.
 * Hence bonus bets are treated as LOSING by default.
 * (Safe behavior – avoids wrong payouts)
 */

export function isWinningPokerBonusBet(
  bet: { nat: string },
  _result: PokerResult
): boolean {
  // Player A 2 card Bonus
  // Player A 7 card Bonus
  // Player B 2 card Bonus
  // Player B 7 card Bonus
  return false;
}

/* ================= LAST 10 FORMAT ================= */

export function formatPokerLast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" : "-"
  }));
}
