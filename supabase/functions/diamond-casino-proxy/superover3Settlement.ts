/* =====================================================
   TYPES
===================================================== */

export interface SuperOver3Result {
  winnerId: number;     // 1 | 2
  winnerName: string;   // IND | AUS
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isSuperOver3Table(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") return false;
  return tableId.toLowerCase() === "superover3";
}

/* =====================================================
   WINNER MAP
===================================================== */

const SUPEROVER3_WINNER_MAP: Record<number, string> = {
  1: "IND",
  2: "AUS",
};

/* =====================================================
   PARSE RESULT
===================================================== */
/**
 * win:
 *  "1" => IND
 *  "2" => AUS
 */
export function parseSuperOver3Result(win: string): SuperOver3Result | null {
  if (!win) return null;

  const winnerId = Number(win);
  const winnerName = SUPEROVER3_WINNER_MAP[winnerId];

  if (!winnerName) return null;

  const result: SuperOver3Result = {
    winnerId,
    winnerName,
  };

  console.log("🏏 [SuperOver3 Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */
/**
 * Only Bookmaker match bets
 * Fancy bets ignored safely
 */
export function isWinningSuperOver3Bet(
  bet: { nat: string; gtype?: string; etype?: string },
  result: SuperOver3Result
): boolean {
  if (!bet?.nat) return false;

  // only main match / bookmaker
  if (bet.gtype && bet.gtype !== "match1" && bet.etype !== "match")
    return false;

  return bet.nat.toUpperCase() === result.winnerName;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatSuperOver3Last10(res: any[]) {
  if (!Array.isArray(res)) return [];

  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "IND" :
      r.win === "2" ? "AUS" : "-"
  }));
}
