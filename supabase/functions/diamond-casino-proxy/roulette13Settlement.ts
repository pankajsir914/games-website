// roulette13Settlement.ts

/* =====================================================
   CONSTANTS
===================================================== */

const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36
]);

/* =====================================================
   TYPES
===================================================== */

export interface Roulette13Result {
  number: number;
  color: "red" | "black" | "green";
  oddEven: "odd" | "even" | null;
  range: "low" | "high" | null;
  dozen: 1 | 2 | 3 | null;
  column: 1 | 2 | 3 | null;
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isRoulette13Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "roulette13";
}

/* =====================================================
   PARSER
===================================================== */

export function parseRoulette13Result(win: string): Roulette13Result {
  const num = parseInt(win, 10);

  const result: Roulette13Result = {
    number: num,
    color: "green",
    oddEven: null,
    range: null,
    dozen: null,
    column: null,
  };

  if (num === 0) return result;

  result.color = RED_NUMBERS.has(num) ? "red" : "black";
  result.oddEven = num % 2 === 0 ? "even" : "odd";
  result.range = num <= 18 ? "low" : "high";

  if (num <= 12) result.dozen = 1;
  else if (num <= 24) result.dozen = 2;
  else result.dozen = 3;

  result.column = ((num - 1) % 3 + 1) as 1 | 2 | 3;

  console.log("🎯 [Roulette13 Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isWinningRoulette13Bet(
  betNat: string,
  result: Roulette13Result
): boolean {
  const bet = betNat.toLowerCase().trim();

  // Split / Street / Corner
  if (bet.includes(",")) {
    return bet
      .split(",")
      .map(n => parseInt(n.trim(), 10))
      .includes(result.number);
  }

  // Single number
  if (/^\d+$/.test(bet)) {
    return parseInt(bet, 10) === result.number;
  }

  // Dozens
  if (bet === "1st 12") return result.dozen === 1;
  if (bet === "2nd 12") return result.dozen === 2;
  if (bet === "3rd 12") return result.dozen === 3;

  // Columns
  if (bet === "1st column") return result.column === 1;
  if (bet === "2nd column") return result.column === 2;
  if (bet === "3rd column") return result.column === 3;

  // Range
  if (bet === "1 to 18") return result.range === "low";
  if (bet === "19 to 36") return result.range === "high";

  // Color
  if (bet === "red") return result.color === "red";
  if (bet === "black") return result.color === "black";

  // Odd / Even
  if (bet === "odd") return result.oddEven === "odd";
  if (bet === "even") return result.oddEven === "even";

  return false;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatRoulette13Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result: r.win, // "07", "20" etc
  }));
}
