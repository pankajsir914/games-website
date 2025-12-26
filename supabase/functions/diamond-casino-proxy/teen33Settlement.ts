/* =====================================================
   TYPES
===================================================== */

export interface Teen33Result {
  winnerId: number;        // 1 | 2
  winnerName: string;     // Player A | Player B
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isTeen33Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "teen33";
}

/* =====================================================
   PARSE RESULT
===================================================== */

export function parseTeen33Result(win: string): Teen33Result | null {
  if (!win) return null;

  const winnerId = Number(win);
  if (![1, 2].includes(winnerId)) return null;

  const result: Teen33Result = {
    winnerId,
    winnerName: winnerId === 1 ? "Player A" : "Player B",
  };

  console.log("🃏 [Teen33 Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isWinningTeen33Bet(
  bet: { nat: string },
  result: Teen33Result
): boolean {
  return (
    bet.nat.toLowerCase() === result.winnerName.toLowerCase()
  );
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatTeen33Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" : "-"
  }));
}
