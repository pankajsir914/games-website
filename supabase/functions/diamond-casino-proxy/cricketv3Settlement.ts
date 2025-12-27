/* =====================================================
   Cricket V3 (Five Five Cricket) Settlement
===================================================== */

export interface CricketV3Result {
  mid?: string | number;
  winnerId: number;      // 1 | 2
  winnerTeam: string;    // AUS | IND
  score?: string;        // "AUS : 83 | IND : 64"
}

/* ================= TABLE CHECK ================= */

export function isCricketV3(tableId: string): boolean {
  return tableId?.toLowerCase() === "cricketv3";
}

/* ================= PARSE RESULT ================= */

export function parseCricketV3Result(
  win: string,
  winnat: string,
  rdesc?: string,
  mid?: string | number
): CricketV3Result | null {

  if (!win) return null;

  const winnerId = Number(win);

  const result: CricketV3Result = {
    mid,
    winnerId,
    winnerTeam: winnat,
    score: rdesc,
  };

  console.log("🏏 [CRICKETV3 Parsed]", result);
  return result;
}

/* ================= BET CHECK ================= */

export function isWinningCricketV3Bet(
  bet: any,
  result: CricketV3Result
): boolean {

  /**
   * Bookmaker Market
   * psid:
   * 1 → Team 1 (AUS)
   * 2 → Team 2 (IND)
   */

  if (!bet?.psid) return false;

  return Number(bet.psid) === result.winnerId;
}
