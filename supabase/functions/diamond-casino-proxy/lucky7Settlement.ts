// lucky7Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export type Lucky7Result = {
  rank: string;        // "A"
  value: number;       // 1
  color: "red" | "black";
  oddEven: "odd" | "even";
  line: number;        // 1 | 2 | 3 | 4
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isLucky7Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "lucky7";
}

/* =====================================================
   HELPERS
===================================================== */

function getCardValue(rank: string): number {
  if (rank === "A") return 1;
  if (rank === "J") return 11;
  if (rank === "Q") return 12;
  if (rank === "K") return 13;
  return Number(rank);
}

function getColor(card: string): "red" | "black" {
  const suit = card.slice(-2);
  return suit === "HH" || suit === "DD" ? "red" : "black";
}

function getLine(value: number): number {
  if (value <= 3) return 1;
  if (value <= 6) return 2;
  if (value <= 9) return 3;
  return 4;
}

/* =====================================================
   PARSER
===================================================== */

export function parseLucky7Result(card: string | null): Lucky7Result | null {
  if (!card) return null;

  const rank = card.slice(0, card.length - 2);
  const value = getCardValue(rank);
  const color = getColor(card);
  const oddEven = value % 2 === 0 ? "even" : "odd";
  const line = getLine(value);

  return { rank, value, color, oddEven, line };
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isLucky7WinningBet(
  betType: string,
  result: Lucky7Result,
  side: "back" | "lay" = "back"
): boolean {

  const bet = betType.toLowerCase().trim();
  let isMatch = false;

  if (bet === "low card") isMatch = result.value <= 7;
  if (bet === "high card") isMatch = result.value >= 8;
  if (bet === "odd") isMatch = result.oddEven === "odd";
  if (bet === "even") isMatch = result.oddEven === "even";
  if (bet === "red") isMatch = result.color === "red";
  if (bet === "black") isMatch = result.color === "black";

  // Card X
  if (bet.startsWith("card")) {
    const v = bet.replace("card", "").trim().toUpperCase();
    isMatch = v === result.rank;
  }

  // Line X
  if (bet.startsWith("line")) {
    const v = Number(bet.replace("line", "").trim());
    isMatch = v === result.line;
  }

  console.log("🎯 [Lucky7 Match]", { betType, result, isMatch });

  return side === "back" ? isMatch : !isMatch;
}

/* =====================================================
   LAST 10 RESULTS (W/L/T)
===================================================== */

export function formatLucky7LastResults(
  results: Array<{ mid: string | number; win: string }>
) {
  return results.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "W" :
      r.win === "2" ? "L" :
      "T"
  }));
}
