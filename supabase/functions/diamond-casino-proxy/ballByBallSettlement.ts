/* =====================================================
   BALL BY BALL SETTLEMENT
===================================================== */

export interface BallByBallResult {
  winSid: number;
}

/* ================= TABLE CHECK ================= */

export function isBallByBallTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "ballbyball";
}

/* ================= PARSE RESULT ================= */

export function parseBallByBallResult(win: string): BallByBallResult | null {
  const sid = Number(win);
  if (isNaN(sid)) return null;

  return { winSid: sid };
}

/* ================= BET MATCH ================= */

export function isWinningBallByBallBet(
  bet: { sid: number },
  result: BallByBallResult
): boolean {
  return bet.sid === result.winSid;
}
