// teen62Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export type Teen62Result = {
  winner: string;      // "Player A" | "Player B"
  winCode: string;     // "1" | "2"
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isTeen62Table(tableId: string): boolean {
  if (!tableId) return false;
  const t = tableId.toLowerCase();
  return t === "teen62" || t.includes("teen");
}

/* =====================================================
   RESULT PARSER
===================================================== */

export function parseTeen62Result(
  rdesc: string | null,
  winnat: string | null,
  win: string | null
): Teen62Result | null {
  if (winnat) {
    return {
      winner: winnat.trim(),
      winCode: win || ""
    };
  }

  if (!rdesc) return null;

  // rdesc example:
  // "Player B#Heart Diamond ...#A : Yes | B : No"
  const firstPart = rdesc.split("#")[0]?.trim();
  if (!firstPart) return null;

  return {
    winner: firstPart,
    winCode: win || ""
  };
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isTeen62WinningBet(
  betType: string,
  result: Teen62Result,
  side: "back" | "lay" = "back"
): boolean {
  if (!betType) return false;

  const bet = betType.toLowerCase().trim();
  const winner = result.winner.toLowerCase().trim();

  const isMatch = bet === winner;

  // BACK = match wins
  if (side === "back") return isMatch;

  // LAY = non-match wins
  return !isMatch;
}

/* =====================================================
   LAST 10 RESULTS FORMAT
===================================================== */

export function formatTeen62LastResults(
  results: Array<{ mid: string | number; win: string }>
) {
  return results.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" :
      "?"
  }));
}
