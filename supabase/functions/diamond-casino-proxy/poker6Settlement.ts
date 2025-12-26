/* =====================================================
   POKER6 (Poker – 6 Players) Settlement
===================================================== */

/* ================= TYPES ================= */

export type Poker6Hand =
  | "High Card"
  | "Pair"
  | "Two Pair"
  | "Three of a Kind"
  | "Straight"
  | "Flush"
  | "Full House"
  | "Four of a Kind"
  | "Straight Flush";

export interface Poker6Result {
  winnerPlayer: number;       // 1–6
  winnerHand: Poker6Hand;
  cards: string[];            // all dealt cards
  rdesc?: string;
}

/* ================= TABLE CHECK ================= */

export function isPoker6Table(tableId: string): boolean {
  if (!tableId) return false;
  const t = tableId.toLowerCase();
  return t === "poker6" || t.includes("poker6");
}

/* ================= PARSE RESULT ================= */

export function parsePoker6Result(
  win: string,
  card: string,
  rdesc?: string
): Poker6Result | null {
  if (!rdesc) return null;

  // Example rdesc:
  // "Player 3#Flush"

  const match = rdesc.match(/player\s*(\d+)\s*#\s*(.+)/i);
  if (!match) return null;

  const winnerPlayer = Number(match[1]);
  const winnerHand = match[2].trim() as Poker6Hand;

  const result: Poker6Result = {
    winnerPlayer,
    winnerHand,
    cards: card ? card.split(",") : [],
    rdesc,
  };

  console.log("🂡 [POKER6 Parsed]", result);
  return result;
}

/* ================= PLAYER WINNER BET ================= */

export function isWinningPoker6PlayerBet(
  bet: { nat: string },
  result: Poker6Result
): boolean {
  const match = bet.nat.match(/player\s*(\d+)/i);
  if (!match) return false;

  const pid = Number(match[1]);
  return pid === result.winnerPlayer;
}

/* ================= HAND TYPE BET ================= */

export function isWinningPoker6HandBet(
  bet: { nat: string },
  result: Poker6Result
): boolean {
  return bet.nat.toLowerCase() === result.winnerHand.toLowerCase();
}

/* ================= LAST 10 FORMAT ================= */

export function formatPoker6Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result: r.win || "-"
  }));
}
