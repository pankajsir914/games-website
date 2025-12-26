/* =====================================================
   CARD32EU (32 Cards B) Settlement
===================================================== */

export type Card32EUWinner =
  | "Player 8"
  | "Player 9"
  | "Player 10"
  | "Player 11";

export interface Card32EUResult {
  winner: Card32EUWinner;
  cards: string[];
  rdesc?: string;
  mid?: string | number;
}

/* ================= TABLE CHECK ================= */

export function isCard32EUTable(tableId: string): boolean {
  return tableId?.toLowerCase().includes("card32eu");
}

/* ================= PARSE RESULT ================= */

export function parseCard32EUResult(
  win: string,
  card: string,
  rdesc?: string,
  mid?: string | number
): Card32EUResult | null {
  if (!win) return null;

  const winnerMap: Record<string, Card32EUWinner> = {
    "1": "Player 8",
    "2": "Player 9",
    "3": "Player 10",
    "4": "Player 11",
  };

  const winner = winnerMap[win];
  if (!winner) return null;

  const result: Card32EUResult = {
    winner,
    cards: card ? card.split(",") : [],
    rdesc,
    mid,
  };

  console.log("🃏 [CARD32EU Parsed]", result);
  return result;
}

/* ================= MAIN MATCH ================= */

export function isWinningCard32EUMatch(
  bet: { nat: string },
  result: Card32EUResult
): boolean {
  return bet.nat.toLowerCase() === result.winner.toLowerCase();
}

/* ================= ODD / EVEN ================= */

export function isWinningCard32EUOddEven(
  bet: { nat: string },
  rdesc?: string
): boolean {
  if (!rdesc) return false;

  const nat = bet.nat.toLowerCase();
  const blocks = rdesc.split("#")[1] || "";

  return nat.includes("odd")
    ? blocks.toLowerCase().includes("odd")
    : nat.includes("even")
    ? blocks.toLowerCase().includes("even")
    : false;
}

/* ================= ANY THREE CARD ================= */

export function isWinningCard32EUThreeCard(
  bet: { nat: string },
  rdesc?: string
): boolean {
  if (!rdesc) return false;

  const nat = bet.nat.toLowerCase();

  if (nat.includes("black"))
    return rdesc.toLowerCase().includes("black");

  if (nat.includes("red"))
    return rdesc.toLowerCase().includes("red");

  return false;
}

/* ================= TOTAL BET ================= */

export function isWinningCard32EUTotal(
  bet: { nat: string },
  rdesc?: string
): boolean {
  if (!rdesc) return false;

  if (bet.nat.includes("8 & 9"))
    return rdesc.includes("8-9");

  if (bet.nat.includes("10 & 11"))
    return rdesc.includes("10-11");

  return false;
}

/* ================= SINGLE ================= */

export function isWinningCard32EUSingle(
  bet: { nat: string },
  rdesc?: string
): boolean {
  if (!rdesc) return false;

  const match = bet.nat.match(/\d$/);
  if (!match) return false;

  return rdesc.trim().endsWith(match[0]);
}

/* ================= LAST 10 ================= */

export function formatCard32EULast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "P8" :
      r.win === "2" ? "P9" :
      r.win === "3" ? "P10" :
      r.win === "4" ? "P11" : "-"
  }));
}
