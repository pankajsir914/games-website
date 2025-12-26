/* =====================================================
   TYPES
===================================================== */

export interface SuperOver2Result {
  winnerId: number;          // 0 | 1 | 2
  winnerName: "IND" | "ENG" | "TIE";
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isSuperOver2Table(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") return false;
  return tableId.toLowerCase() === "superover2";
}

/* =====================================================
   WINNER MAP
===================================================== */

const SUPEROVER2_WINNER_MAP: Record<number, "IND" | "ENG" | "TIE"> = {
  0: "TIE",
  1: "IND",
  2: "ENG",
};

/* =====================================================
   PARSE RESULT
===================================================== */
/**
 * win:
 *  "1" => IND
 *  "2" => ENG
 *  "0" => TIE
 */
export function parseSuperOver2Result(
  win: string
): SuperOver2Result | null {
  if (win === undefined || win === null) return null;

  const winnerId = Number(win);
  const winnerName = SUPEROVER2_WINNER_MAP[winnerId];

  if (!winnerName) return null;

  const result: SuperOver2Result = {
    winnerId,
    winnerName,
  };

  console.log("🏏 [SuperOver2 Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */
/**
 * Only Bookmaker / Match bets
 * Fancy1 ignored safely
 */
export function isWinningSuperOver2Bet(
  bet: { nat: string; gtype?: string; etype?: string },
  result: SuperOver2Result
): boolean {
  if (!bet?.nat) return false;

  // allow only match / bookmaker
  if (bet.gtype && bet.gtype !== "match1" && bet.etype !== "match")
    return false;

  // TIE handling
  if (result.winnerName === "TIE") {
    return bet.nat.toLowerCase() === "tie";
  }

  return bet.nat.toUpperCase() === result.winnerName;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatSuperOver2Last10(res: any[]) {
  if (!Array.isArray(res)) return [];

  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "IND" :
      r.win === "2" ? "ENG" :
      r.win === "0" ? "TIE" : "-"
  }));
}
