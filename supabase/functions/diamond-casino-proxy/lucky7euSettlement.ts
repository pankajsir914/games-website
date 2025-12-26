/* =====================================================
   LUCKY7 EU (Lucky 7 - B) Settlement
===================================================== */

export type Lucky7EUWinner = "Low Card" | "High Card";

export interface Lucky7EUResult {
  winner: Lucky7EUWinner;
  oddEven?: "Odd" | "Even";
  color?: "Red" | "Black";
  cardValue?: string;      // 1-10, J, Q, K
  lineCards?: string[];    // e.g. ["J","Q","K"]
  cards: string[];
  rdesc?: string;
  mid?: string | number;
}

/* ================= TABLE CHECK ================= */

export function isLucky7EUTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "lucky7eu";
}

/* ================= PARSE RESULT ================= */

export function parseLucky7EUResult(
  win: string,
  card: string,
  rdesc?: string,
  mid?: string | number
): Lucky7EUResult | null {
  if (!win || !rdesc) return null;

  const winner: Lucky7EUWinner =
    win === "1" ? "Low Card" : "High Card";

  const parts = rdesc.split("#");

  const result: Lucky7EUResult = {
    winner,
    oddEven: parts[1] as "Odd" | "Even",
    color: parts[2] as "Red" | "Black",
    cardValue: parts[3],
    lineCards: parts[4]?.split(" ") || [],
    cards: card ? card.split(",") : [],
    rdesc,
    mid,
  };

  console.log("🎰 [LUCKY7EU Parsed]", result);
  return result;
}

/* ================= MAIN ================= */

export function isWinningLucky7EUMain(
  bet: { nat: string },
  result: Lucky7EUResult
): boolean {
  return bet.nat === result.winner;
}

/* ================= ODD / EVEN ================= */

export function isWinningLucky7EUOddEven(
  bet: { nat: string },
  result: Lucky7EUResult
): boolean {
  if (bet.nat === "Odd") return result.oddEven === "Odd";
  if (bet.nat === "Even") return result.oddEven === "Even";
  return false;
}

/* ================= COLOR ================= */

export function isWinningLucky7EUColor(
  bet: { nat: string },
  result: Lucky7EUResult
): boolean {
  if (bet.nat === "Red") return result.color === "Red";
  if (bet.nat === "Black") return result.color === "Black";
  return false;
}

/* ================= CARD ================= */

export function isWinningLucky7EUCard(
  bet: { nat: string },
  result: Lucky7EUResult
): boolean {
  if (!bet.nat.startsWith("Card")) return false;

  const value = bet.nat.replace("Card", "").trim();
  return value === result.cardValue;
}

/* ================= LINE ================= */

export function isWinningLucky7EULine(
  bet: { nat: string },
  result: Lucky7EUResult
): boolean {
  if (!bet.nat.startsWith("Line")) return false;

  const lineNo = bet.nat.replace("Line", "").trim();

  // Mapping based on API behavior (example)
  // Line 1 -> first 3 cards, Line 2 -> next 3, etc.
  const lineMap: Record<string, number[]> = {
    "1": [0, 1, 2],
    "2": [3, 4, 5],
    "3": [6, 7, 8],
    "4": [9, 10, 11],
  };

  const indexes = lineMap[lineNo];
  if (!indexes) return false;

  return result.lineCards.some(card =>
    indexes.some(i => result.lineCards[i] === card)
  );
}

/* ================= LAST 10 ================= */

export function formatLucky7EULast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result: r.win === "1" ? "L" : "H",
  }));
}
