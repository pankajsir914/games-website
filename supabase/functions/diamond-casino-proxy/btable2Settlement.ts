/* =====================================================
   TYPES
===================================================== */

export interface BTable2Result {
  winnerId: number;       // 1..6
  winnerName: string;     // Don | Amar Akbar Anthony | ...
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isBTable2Table(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") return false;
  return tableId.toLowerCase() === "btable2";
}

/* =====================================================
   WINNER MAP
===================================================== */

const Bतालe2_WINNER_MAP: Record<number, string> = {
  1: "Don",
  2: "Amar Akbar Anthony",
  3: "Sahib Bibi Aur Ghulam",
  4: "Dharam Veer",
  5: "Kis Kis ko Pyaar Karoon",
  6: "Ghulam",
};

/* =====================================================
   PARSE RESULT
===================================================== */
/**
 * win examples:
 *  "1".."6"
 */
export function parseBTable2Result(win: string): BTable2Result | null {
  if (!win) return null;

  const winnerId = Number(win);
  const winnerName = Bतालe2_WINNER_MAP[winnerId];

  if (!winnerName) return null;

  const result: BTable2Result = {
    winnerId,
    winnerName,
  };

  console.log("🎬 [BTable2 Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */
/**
 * Match bets:
 * - Only etype === "match"
 * - nat must match winnerName
 */
export function isWinningBTable2Bet(
  bet: { nat: string; etype?: string },
  result: BTable2Result
): boolean {
  if (!bet?.nat) return false;

  // Only main match bets
  if (bet.etype && bet.etype !== "match") return false;

  return bet.nat.toLowerCase() === result.winnerName.toLowerCase();
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatBTable2Last10(res: any[]) {
  if (!Array.isArray(res)) return [];

  return res.map(r => ({
    mid: r.mid,
    result: Bतालe2_WINNER_MAP[Number(r.win)] ?? "-"
  }));
}
