// teen120Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export type Teen120Result = {
  winner: "player" | "dealer" | "tie" | null;
  isPair: boolean;
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isTeen120Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "teen120";
}

/* =====================================================
   PARSER
===================================================== */

export function parseTeen120Result(
  win: string | number,
  winnat?: string,
  rdesc?: string
): Teen120Result {
  let winner: Teen120Result["winner"] = null;

  if (String(win) === "1") winner = "player";
  if (String(win) === "2") winner = "dealer";
  if (String(win) === "0") winner = "tie";

  if (winnat) {
    const wn = winnat.toLowerCase();
    if (wn === "player") winner = "player";
    if (wn === "dealer") winner = "dealer";
    if (wn === "tie") winner = "tie";
  }

  const isPair =
    typeof rdesc === "string" &&
    rdesc.toLowerCase().includes("pair");

  console.log("🎯 [TEEN120 Parsed]", {
    win,
    winnat,
    rdesc,
    winner,
    isPair
  });

  return {
    winner,
    isPair
  };
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isTeen120WinningBet(
  betNat: string,
  result: Teen120Result,
  side: "back" | "lay" = "back"
): boolean {
  const bet = betNat.toLowerCase().trim();
  let isWin = false;

  // MATCH BETS
  if (bet === "player") {
    isWin = result.winner === "player";
  }

  if (bet === "dealer") {
    isWin = result.winner === "dealer";
  }

  if (bet === "tie") {
    isWin = result.winner === "tie";
  }

  // PAIR BET
  if (bet === "pair") {
    isWin = result.isPair === true;
  }

  console.log("🔍 [TEEN120 Match]", {
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
   LAST 10 RESULTS FORMAT
===================================================== */

export function formatTeen120LastResults(
  results: Array<{ mid: string | number; win: string }>
) {
  return results.map(r => ({
    mid: r.mid,
    result:
      r.win === "1"
        ? "Player"
        : r.win === "2"
        ? "Dealer"
        : "Tie"
  }));
}
