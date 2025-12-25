// poison20Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export interface Poison20Result {
  winnerId: number;        // 1 | 2
  winnerName: string;      // Player A | Player B
  evenOdd?: "Even" | "Odd";
  color?: "Red" | "Black";
  suit?: "Spade" | "Heart" | "Diamond" | "Club";
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isPoison20Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "poison20";
}

/* =====================================================
   PARSE RESULT
===================================================== */

export function parsePoison20Result(
  win: string,
  rdesc?: string
): Poison20Result | null {
  if (!win) return null;

  const winnerId = Number(win);
  const parts = rdesc?.split("#") || [];

  const result: Poison20Result = {
    winnerId,
    winnerName: winnerId === 1 ? "Player A" : "Player B",
  };

  for (const p of parts) {
    if (p === "Even" || p === "Odd") result.evenOdd = p;
    if (p === "Red" || p === "Black") result.color = p;
    if (
      p === "Spade" ||
      p === "Heart" ||
      p === "Diamond" ||
      p === "Club"
    ) {
      result.suit = p;
    }
  }

  console.log("🧪 [Poison20 Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isWinningPoison20Bet(
  bet: { nat: string },
  result: Poison20Result
): boolean {
  const nat = bet.nat;

  if (nat === result.winnerName) return true;
  if (nat === `Poison ${result.evenOdd}`) return true;
  if (nat === `Poison ${result.color}`) return true;
  if (nat === `Poison ${result.suit}`) return true;

  return false;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatPoison20Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" : "-"
  }));
}
