// ab3Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export type Ab3Result = {
  isWin: boolean;
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isAb3Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "ab3";
}

/* =====================================================
   PARSER
===================================================== */

export function parseAb3Result(
  win: string | number,
  winnat?: string
): Ab3Result {
  const isWin =
    String(win).trim() === "0" ||
    String(winnat).toLowerCase() === "win";

  console.log("🎯 [AB3 Parsed]", {
    win,
    winnat,
    isWin
  });

  return { isWin };
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isAb3WinningBet(
  betNat: string,
  result: Ab3Result,
  side: "back" | "lay" = "back"
): boolean {
  const betIsWin = betNat.toLowerCase() === "win";

  console.log("🔍 [AB3 Match]", {
    betNat,
    betIsWin,
    result,
    side
  });

  if (side === "back") {
    return betIsWin && result.isWin;
  }

  // lay
  return !(betIsWin && result.isWin);
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatAb3LastResults(
  results: Array<{ mid: string | number; win: string | number }>
) {
  return results.map(r => ({
    mid: r.mid,
    result: r.win === "0" ? "Win" : "No Result"
  }));
}
