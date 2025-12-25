// joker120Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export interface Joker120Result {
  winnerId: number;      // 1 | 2
  winnerName: string;    // Player A | Player B
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isJoker120Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "joker120";
}

/* =====================================================
   PARSE RESULT
===================================================== */

export function parseJoker120Result(win: string): Joker120Result | null {
  if (!win) return null;

  const winnerId = Number(win);

  const result: Joker120Result = {
    winnerId,
    winnerName: winnerId === 1 ? "Player A" : "Player B",
  };

  console.log("🃏 [Joker120 Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isWinningJoker120Bet(
  bet: { nat: string },
  result: Joker120Result
): boolean {
  return bet.nat === result.winnerName;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatJoker120Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" : "-"
  }));
}
