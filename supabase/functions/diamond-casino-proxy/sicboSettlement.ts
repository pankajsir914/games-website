/* =====================================================
   SIC BO SETTLEMENT
===================================================== */

export interface SicBoResult {
  dice: number[];
  total: number;
  isTriple: boolean;
}

/* ================= TABLE CHECK ================= */

export function isSicBoTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "sicbo";
}

/* ================= PARSE RESULT ================= */

export function parseSicBoResult(card: string): SicBoResult | null {
  if (!card) return null;

  const dice = card.split(",").map(n => Number(n));
  if (dice.length !== 3 || dice.some(isNaN)) return null;

  const total = dice.reduce((a, b) => a + b, 0);
  const isTriple = dice[0] === dice[1] && dice[1] === dice[2];

  return { dice, total, isTriple };
}

/* ================= BET MATCH ================= */

export function isWinningSicBoBet(
  bet: { nat: string },
  result: SicBoResult
): boolean {

  const { dice, total, isTriple } = result;
  const nat = bet.nat.trim().toLowerCase();

  // Small / Big
  if (nat === "small") return total >= 4 && total <= 10 && !isTriple;
  if (nat === "big")   return total >= 11 && total <= 17 && !isTriple;

  // Odd / Even
  if (nat === "odd")  return total % 2 === 1;
  if (nat === "even") return total % 2 === 0;

  // Any Triple
  if (nat === "any triple") return isTriple;

  // Triple X
  if (nat.startsWith("triple")) {
    const x = Number(nat.split(" ")[1]);
    return isTriple && dice[0] === x;
  }

  // Double X
  if (nat.startsWith("double")) {
    const x = Number(nat.split(" ")[1]);
    return dice.filter(d => d === x).length === 2;
  }

  // Total N
  if (nat.startsWith("total")) {
    const n = Number(nat.split(" ")[1]);
    return total === n;
  }

  // Combination X and Y
  if (nat.startsWith("combination")) {
    const parts = nat.match(/\d+/g);
    if (!parts || parts.length !== 2) return false;
    const [a, b] = parts.map(Number);
    return dice.includes(a) && dice.includes(b);
  }

  // Single X
  if (nat.startsWith("single")) {
    const x = Number(nat.split(" ")[1]);
    return dice.includes(x);
  }

  return false;
}
