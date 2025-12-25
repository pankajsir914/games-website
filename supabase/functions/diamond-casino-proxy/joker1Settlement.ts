// joker1Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export interface Joker1Result {
  winnerId: number;       // 1 | 2
  winnerName: string;     // Player A | Player B
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isJoker1Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "joker1";
}

/* =====================================================
   PARSE RESULT
===================================================== */

export function parseJoker1Result(win: string): Joker1Result | null {
  if (!win) return null;

  const winnerId = Number(win);

  const result: Joker1Result = {
    winnerId,
    winnerName: winnerId === 1 ? "Player A" : "Player B",
  };

  console.log("🃏 [Joker1 Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isWinningJoker1Bet(
  bet: { nat: string },
  result: Joker1Result
): boolean {
  return bet.nat.toLowerCase() === result.winnerName.toLowerCase();
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatJoker1Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" : "-"
  }));
}
