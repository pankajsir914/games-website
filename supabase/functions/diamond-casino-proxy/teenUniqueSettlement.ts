// teenUniqueSettlement.ts

/* =====================================================
   TYPES
===================================================== */

export interface TeenUniqueResult {
  isWin: boolean;
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isTeenUniqueTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "teenunique";
}

/* =====================================================
   PARSE RESULT
===================================================== */

export function parseTeenUniqueResult(
  win: string,
  rdesc?: string
): TeenUniqueResult {
  /**
   * API behavior:
   * win = "0"  -> WON
   * rdesc = "Won"
   */

  const isWin = win === "0" || rdesc?.toLowerCase() === "won";

  const result: TeenUniqueResult = { isWin };

  console.log("🧩 [TeenUnique Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isWinningTeenUniqueBet(
  result: TeenUniqueResult
): boolean {
  // Only one fancy bet exists
  return result.isWin;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatTeenUniqueLast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result: r.win === "0" ? "W" : "L",
  }));
}
