/* =====================================================
   TYPES
===================================================== */

export interface Sicbo2Result {
  dice: number[];        // [2,2,5]
  total: number;         // 9
  isTriple: boolean;
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isSicbo2Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "sicbo2";
}

/* =====================================================
   PARSE RESULT
===================================================== */

export function parseSicbo2Result(card: string): Sicbo2Result | null {
  if (!card) return null;

  const dice = card
    .split(",")
    .map(n => Number(n))
    .filter(n => n >= 1 && n <= 6);

  if (dice.length !== 3) return null;

  const total = dice.reduce((a, b) => a + b, 0);
  const isTriple = dice[0] === dice[1] && dice[1] === dice[2];

  const result: Sicbo2Result = { dice, total, isTriple };

  console.log("🎲 [SicBo Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isWinningSicbo2Bet(
  bet: { nat: string },
  result: Sicbo2Result
): boolean {
  const name = bet.nat.toLowerCase();
  const { dice, total, isTriple } = result;

  // --- Small / Big ---
  if (name === "small") return total >= 4 && total <= 10 && !isTriple;
  if (name === "big") return total >= 11 && total <= 17 && !isTriple;

  // --- Odd / Even ---
  if (name === "odd") return total % 2 === 1;
  if (name === "even") return total % 2 === 0;

  // --- Any Triple ---
  if (name === "any triple") return isTriple;

  // --- Double X ---
  if (name.startsWith("double")) {
    const x = Number(name.replace("double", "").trim());
    return dice.filter(d => d === x).length >= 2;
  }

  // --- Triple X ---
  if (name.startsWith("triple")) {
    const x = Number(name.replace("triple", "").trim());
    return isTriple && dice[0] === x;
  }

  // --- Total N ---
  if (name.startsWith("total")) {
    const n = Number(name.replace("total", "").trim());
    return total === n;
  }

  // --- Combination X and Y ---
  if (name.startsWith("combination")) {
    const nums = name.match(/\d+/g)?.map(Number);
    if (!nums || nums.length !== 2) return false;
    return dice.includes(nums[0]) && dice.includes(nums[1]);
  }

  // --- Single X ---
  if (name.startsWith("single")) {
    const x = Number(name.replace("single", "").trim());
    return dice.includes(x);
  }

  return false;
}

/* =====================================================
   LAST 10 FORMAT
===================================================== */

export function formatSicbo2Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    total: Number(r.win)
  }));
}
