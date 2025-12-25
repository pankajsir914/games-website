// teen1Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export type Teen1Result = {
  winner: "player" | "dealer" | null;
  playerTrend: "up" | "down" | null;
  dealerTrend: "up" | "down" | null;
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isTeen1Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "teen1";
}

/* =====================================================
   PARSER
===================================================== */

export function parseTeen1Result(
  win: string | number,
  winnat?: string,
  rdesc?: string
): Teen1Result {
  let winner: Teen1Result["winner"] = null;

  if (String(win) === "1") winner = "player";
  if (String(win) === "2") winner = "dealer";

  let playerTrend: "up" | "down" | null = null;
  let dealerTrend: "up" | "down" | null = null;

  if (rdesc) {
    const lower = rdesc.toLowerCase();

    if (lower.includes("p : up")) playerTrend = "up";
    if (lower.includes("p : down")) playerTrend = "down";

    if (lower.includes("d : up")) dealerTrend = "up";
    if (lower.includes("d : down")) dealerTrend = "down";
  }

  console.log("🎯 [TEEN1 Parsed]", {
    win,
    winnat,
    winner,
    playerTrend,
    dealerTrend
  });

  return {
    winner,
    playerTrend,
    dealerTrend
  };
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isTeen1WinningBet(
  betNat: string,
  result: Teen1Result,
  side: "back" | "lay" = "back"
): boolean {
  const bet = betNat.toLowerCase();

  let isWin = false;

  // MATCH
  if (bet === "player") {
    isWin = result.winner === "player";
  }

  if (bet === "dealer") {
    isWin = result.winner === "dealer";
  }

  // 7 UP / DOWN
  if (bet.includes("7 up player")) {
    isWin = result.playerTrend === "up";
  }

  if (bet.includes("7 down player")) {
    isWin = result.playerTrend === "down";
  }

  if (bet.includes("7 up dealer")) {
    isWin = result.dealerTrend === "up";
  }

  if (bet.includes("7 down dealer")) {
    isWin = result.dealerTrend === "down";
  }

  console.log("🔍 [TEEN1 Match]", {
    betNat,
    isWin,
    result,
    side
  });

  // BACK
  if (side === "back") return isWin;

  // LAY
  return !isWin;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatTeen1LastResults(
  results: Array<{ mid: string | number; win: string }>
) {
  return results.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "Player" :
      r.win === "2" ? "Dealer" :
      "NA"
  }));
}
