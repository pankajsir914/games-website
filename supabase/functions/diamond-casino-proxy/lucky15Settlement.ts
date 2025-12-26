/* =====================================================
   TYPES
===================================================== */

export interface Lucky15Result {
  winnerId: number;        // 1..6
  winnerName: string;      // "0 Runs" | "1 Runs" | ...
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isLucky15Table(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") return false;
  return tableId.toLowerCase() === "lucky15";
}

/* =====================================================
   WINNER MAP
===================================================== */

const LUCKY15_WINNER_MAP: Record<number, string> = {
  1: "0 Runs",
  2: "1 Runs",
  3: "2 Runs",
  4: "4 Runs",
  5: "6 Runs",
  6: "Wicket",
};

/* =====================================================
   PARSE RESULT
===================================================== */
/**
 * win examples:
 *  "1".."6"
 */
export function parseLucky15Result(win: string): Lucky15Result | null {
  if (!win) return null;

  const winnerId = Number(win);
  const winnerName = LUCKY15_WINNER_MAP[winnerId];

  if (!winnerName) return null;

  const result: Lucky15Result = {
    winnerId,
    winnerName,
  };

  console.log("🎯 [Lucky15 Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */
/**
 * Only match bets
 */
export function isWinningLucky15Bet(
  bet: { nat: string },
  result: Lucky15Result
): boolean {
  if (!bet?.nat) return false;

  return bet.nat.toLowerCase() === result.winnerName.toLowerCase();
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatLucky15Last10(res: any[]) {
  if (!Array.isArray(res)) return [];

  return res.map(r => ({
    mid: r.mid,
    result: LUCKY15_WINNER_MAP[Number(r.win)] ?? "-"
  }));
}
