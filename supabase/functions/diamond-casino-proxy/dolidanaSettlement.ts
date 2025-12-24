// dolidanaSettlement.ts

/* =====================================================
   TYPES
===================================================== */

export type DolidanaResult = {
  dice: number[];   // [3,3]
  sum: number;      // 6
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isDolidanaTable(tableId: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase() === "dolidana";
}

/* =====================================================
   RESULT PARSER
===================================================== */

export function parseDolidanaResult(
  card: string | null,
  win: string | null
): DolidanaResult | null {

  if (!card || !win) return null;

  const dice = card
    .split(",")
    .map(v => parseInt(v.trim(), 10))
    .filter(n => !isNaN(n));

  if (dice.length !== 2) {
    console.warn("⚠️ [Dolidana] Invalid dice:", card);
    return null;
  }

  const sum = parseInt(win, 10);

  if (isNaN(sum)) return null;

  return { dice, sum };
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isDolidanaWinningBet(
  betType: string,
  result: DolidanaResult,
  side: "back" | "lay" = "back"
): boolean {

  const bet = betType.toLowerCase().trim();
  const [a, b] = result.dice;
  const sum = result.sum;

  let isMatch = false;

  // Any Pair
  if (bet === "any pair") {
    isMatch = a === b;
  }

  // X-X Pair
  if (!isMatch && bet.includes("-")) {
    const [x, y] = bet.split("-").map(v => parseInt(v, 10));
    if (x === y && a === b && a === x) {
      isMatch = true;
    }
  }

  // Sum Total N
  if (!isMatch && bet.startsWith("sum total")) {
    const n = parseInt(bet.replace("sum total", "").trim(), 10);
    if (!isNaN(n) && sum === n) {
      isMatch = true;
    }
  }

  // Odd / Even
  if (!isMatch && bet === "odd") {
    isMatch = sum % 2 === 1;
  }

  if (!isMatch && bet === "even") {
    isMatch = sum % 2 === 0;
  }

  // Lucky 7
  if (!isMatch && bet === "lucky 7") {
    isMatch = sum === 7;
  }

  // Greater / Less than 7
  if (!isMatch && bet === "greater than 7") {
    isMatch = sum > 7;
  }

  if (!isMatch && bet === "less than 7") {
    isMatch = sum < 7;
  }

  console.log("🎲 [Dolidana Match]", {
    betType,
    dice: result.dice,
    sum,
    isMatch
  });

  return side === "back" ? isMatch : !isMatch;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatDolidanaLastResults(
  results: Array<{ mid: string | number; win: string }>
) {
  return results.map(r => ({
    mid: r.mid,
    result: r.win   // sum directly
  }));
}
