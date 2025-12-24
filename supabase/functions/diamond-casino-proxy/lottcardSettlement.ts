// lottcardSettlement.ts

/* =====================================================
   TYPES
===================================================== */

export type LottcardResult = {
  digits: number[];
  type: "single" | "double" | "triple";
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isLottcardTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "lottcard";
}

/* =====================================================
   PARSER
===================================================== */

export function parseLottcardResult(
  rdesc: string | null
): LottcardResult | null {
  if (!rdesc) return null;

  const digits = rdesc
    .trim()
    .split(/\s+/)
    .map(n => Number(n))
    .filter(n => !isNaN(n));

  if (digits.length !== 3) return null;

  const unique = new Set(digits);

  let type: LottcardResult["type"] = "single";
  if (unique.size === 1) type = "triple";
  else if (unique.size === 2) type = "double";

  console.log("🎯 [Lottcard Parsed]", { digits, type });

  return { digits, type };
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isLottcardWinningBet(
  betType: string,
  result: LottcardResult,
  side: "back" | "lay" = "back"
): boolean {
  const bet = betType.toLowerCase().trim();
  const isMatch = bet === result.type;

  console.log("🔍 [Lottcard Match]", {
    betType,
    normalizedBet: bet,
    resultType: result.type,
    isMatch
  });

  return side === "back" ? isMatch : !isMatch;
}

/* =====================================================
   LAST 10 RESULTS (DISPLAY)
===================================================== */

export function formatLottcardLastResults(
  results: Array<{ mid: string | number; win: string }>
) {
  return results.map(r => ({
    mid: r.mid,
    result: r.win // "4 9 5"
  }));
}
