// joker20Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export interface Joker20Result {
  winnerId: number;          // 1 | 2
  winnerName: string;        // Player A | Player B
  attributes: Set<string>;   // odd even red black heart etc
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isJoker20Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "joker20";
}

/* =====================================================
   PARSE RESULT
===================================================== */

export function parseJoker20Result(
  win: string,
  rdesc?: string
): Joker20Result | null {
  if (!win) return null;

  const attrs = new Set<string>();

  if (rdesc) {
    rdesc
      .split("#")
      .map(v => v.trim().toLowerCase())
      .forEach(v => attrs.add(v));
  }

  const winnerId = Number(win);

  const result: Joker20Result = {
    winnerId,
    winnerName: winnerId === 1 ? "Player A" : "Player B",
    attributes: attrs,
  };

  console.log("🃏 [Joker20 Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isWinningJoker20Bet(
  bet: { nat: string },
  result: Joker20Result
): boolean {
  const nat = bet.nat.toLowerCase();

  // Main players
  if (nat === "player a" || nat === "player b") {
    return nat === result.winnerName.toLowerCase();
  }

  // Side bets (odd/even/red/black/heart etc)
  return result.attributes.has(nat);
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatJoker20Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" : "-"
  }));
}
