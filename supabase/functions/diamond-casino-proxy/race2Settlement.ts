// race2Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export type Race2Result = {
  winnerSid: string;
  winnerName: string;
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isRace2Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "race2";
}

/* =====================================================
   PARSER
===================================================== */

export function parseRace2Result(
  win: string | number,
  winnat?: string
): Race2Result {
  const winnerSid = String(win).trim();
  const winnerName = (winnat || "").trim();

  console.log("🎯 [RACE2 Parsed]", {
    winnerSid,
    winnerName
  });

  return {
    winnerSid,
    winnerName
  };
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isRace2WinningBet(
  betNat: string,
  betSid: string | number,
  result: Race2Result,
  side: "back" | "lay" = "back"
): boolean {
  const isWinner =
    String(betSid) === result.winnerSid ||
    betNat.toLowerCase() === result.winnerName.toLowerCase();

  console.log("🔍 [RACE2 Match]", {
    betNat,
    betSid,
    winnerSid: result.winnerSid,
    winnerName: result.winnerName,
    isWinner,
    side
  });

  return side === "back" ? isWinner : !isWinner;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatRace2LastResults(
  results: Array<{ mid: string | number; win: string | number }>
) {
  return results.map(r => ({
    mid: r.mid,
    result: `Player ${r.win}`
  }));
}
