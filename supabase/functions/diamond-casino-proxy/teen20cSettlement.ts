/* =====================================================
   TYPES
===================================================== */

export interface Teen20CResult {
  winnerId: number;       // 1 | 2
  winnerName: string;     // Player A | Player B
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isTeen20CTable(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") return false;
  return tableId.toLowerCase() === "teen20c";
}

/* =====================================================
   PARSE RESULT
===================================================== */
/**
 * win:
 *  "1" => Player A
 *  "2" => Player B
 */
export function parseTeen20CResult(win: string): Teen20CResult | null {
  if (!win) return null;

  const winnerId = Number(win);
  if (winnerId !== 1 && winnerId !== 2) return null;

  const result: Teen20CResult = {
    winnerId,
    winnerName: winnerId === 1 ? "Player A" : "Player B",
  };

  console.log("🃏 [Teen20C Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */
/**
 * Only Player A / Player B bets are matched here.
 * Fancy (Pair, Color, Total etc.) can be added later if needed.
 */
export function isWinningTeen20CBet(
  bet: { nat: string },
  result: Teen20CResult
): boolean {
  if (!bet?.nat) return false;
  return bet.nat.toLowerCase() === result.winnerName.toLowerCase();
}

/* =====================================================
   LAST 10 RESULTS FORMAT
===================================================== */
/**
 * Used for roadmap / history UI
 */
export function formatTeen20CLast10(res: any[]) {
  if (!Array.isArray(res)) return [];

  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" : "-"
  }));
}
