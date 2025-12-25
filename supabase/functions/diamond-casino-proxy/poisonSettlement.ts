// poisonSettlement.ts

/* =====================================================
   TYPES
===================================================== */

export interface PoisonResult {
  winner: "Player A" | "Player B";
  oddEven: "Even" | "Odd";
  color: "Red" | "Black";
  suit: "Spade" | "Heart" | "Diamond" | "Club";
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isPoisonTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "poison";
}

/* =====================================================
   PARSE RESULT
===================================================== */

export function parsePoisonResult(rdesc: string): PoisonResult | null {
  if (!rdesc) return null;

  // Example:
  // "Player A#Even#Black#Spade"
  const parts = rdesc.split("#").map(p => p.trim());

  const result: PoisonResult = {
    winner: parts[0] as "Player A" | "Player B",
    oddEven: parts[1] as "Even" | "Odd",
    color: parts[2] as "Red" | "Black",
    suit: parts[3] as "Spade" | "Heart" | "Diamond" | "Club",
  };

  console.log("🧪 [Poison Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isWinningPoisonBet(
  betNat: string,
  result: PoisonResult
): boolean {
  const bet = betNat.toLowerCase().trim();

  // Main players
  if (bet === "player a") return result.winner === "Player A";
  if (bet === "player b") return result.winner === "Player B";

  // Odd / Even
  if (bet === "poison even") return result.oddEven === "Even";
  if (bet === "poison odd") return result.oddEven === "Odd";

  // Color
  if (bet === "poison red") return result.color === "Red";
  if (bet === "poison black") return result.color === "Black";

  // Suit
  if (bet === "poison spade") return result.suit === "Spade";
  if (bet === "poison heart") return result.suit === "Heart";
  if (bet === "poison diamond") return result.suit === "Diamond";
  if (bet === "poison club") return result.suit === "Club";

  return false;
}

/* =====================================================
   LAST 10 RESULTS FORMAT
===================================================== */

export function formatPoisonLast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    winner: r.win === "1" ? "Player A" : "Player B",
  }));
}
