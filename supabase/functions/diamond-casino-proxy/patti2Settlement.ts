// patti2Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export type Patti2Winner = "Player A" | "Player B" | "Tie";

export type Patti2Result = {
  winner: Patti2Winner;
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isPatti2Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "patti2";
}

/* =====================================================
   RESULT PARSER
===================================================== */

export function parsePatti2Result(
  win: string | number,
  winnat?: string
): Patti2Result {
  const v = String(win).trim();

  if (v === "1") return { winner: "Player A" };
  if (v === "2") return { winner: "Player B" };

  // fallback (tie / cancel)
  if (winnat?.toLowerCase().includes("player a")) {
    return { winner: "Player A" };
  }

  if (winnat?.toLowerCase().includes("player b")) {
    return { winner: "Player B" };
  }

  return { winner: "Tie" };
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isPatti2WinningBet(
  betType: string,
  result: Patti2Result,
  side: "back" | "lay" = "back"
): boolean {
  const bet = betType.toLowerCase().trim();
  const winner = result.winner.toLowerCase();

  const isMatch = bet === winner;

  console.log("🔍 [Patti2 Match]", {
    betType,
    winner,
    isMatch
  });

  return side === "back" ? isMatch : !isMatch;
}

/* =====================================================
   LAST 10 RESULTS (W/L/T)
===================================================== */

export function formatPatti2LastResults(
  results: Array<{ mid: string | number; win: string | number }>
) {
  return results.map(r => {
    const v = String(r.win);
    let result = "T";

    if (v === "1") result = "A";
    else if (v === "2") result = "B";

    return {
      mid: r.mid,
      result
    };
  });
}
