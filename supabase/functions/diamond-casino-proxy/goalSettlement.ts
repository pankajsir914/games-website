/* =====================================================
   TYPES
===================================================== */

export interface GoalResult {
  playerWinnerId: number;     // 1..10
  playerWinnerName: string;   // Player name / No Goal
  goalType?: string;          // Shot Goal | Header Goal | ...
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isGoalTable(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") return false;
  return tableId.toLowerCase() === "goal";
}

/* =====================================================
   PLAYER MAP (sid based)
===================================================== */

const GOAL_PLAYER_MAP: Record<number, string> = {
  1: "Cristiano Ronaldo",
  2: "Lionel Messi",
  3: "Robert Lewandowski",
  4: "Neymar",
  5: "Harry Kane",
  6: "Zlatan Ibrahimovic",
  7: "Romelu Lukaku",
  8: "Kylian Mbappe",
  9: "Erling Haaland",
  10: "No Goal",
};

/* =====================================================
   PARSE RESULT
===================================================== */
/**
 * rdesc example:
 *   "Lionel Messi#Free Kick Goal"
 */
export function parseGoalResult(
  win: string,
  rdesc?: string
): GoalResult | null {
  if (!win) return null;

  const playerWinnerId = Number(win);
  const playerWinnerName = GOAL_PLAYER_MAP[playerWinnerId];
  if (!playerWinnerName) return null;

  let goalType: string | undefined;

  if (rdesc && rdesc.includes("#")) {
    const parts = rdesc.split("#");
    goalType = parts[1]?.trim();
  }

  const result: GoalResult = {
    playerWinnerId,
    playerWinnerName,
    goalType,
  };

  console.log("⚽ [Goal Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */
/**
 * Supports:
 *  - Player bets (subtype: player)
 *  - Goal type bets (subtype: goal)
 */
export function isWinningGoalBet(
  bet: { nat: string; subtype?: string },
  result: GoalResult
): boolean {
  if (!bet?.nat) return false;

  const betName = bet.nat.toLowerCase();

  // -------- Player winner --------
  if (bet.subtype === "player") {
    return betName === result.playerWinnerName.toLowerCase();
  }

  // -------- Goal type --------
  if (bet.subtype === "goal" && result.goalType) {
    return betName === result.goalType.toLowerCase();
  }

  return false;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatGoalLast10(res: any[]) {
  if (!Array.isArray(res)) return [];

  return res.map(r => ({
    mid: r.mid,
    result: GOAL_PLAYER_MAP[Number(r.win)] ?? "-"
  }));
}
