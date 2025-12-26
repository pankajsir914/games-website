/* =====================================================
   TYPES
===================================================== */

export interface OurRouletteResult {
  winNumber: number;      // 0 – 36
  winString: string;      // "02"
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isOurRouletteTable(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") return false;
  return tableId.toLowerCase() === "ourroullete";
}

/* =====================================================
   PARSE RESULT
===================================================== */
/**
 * win examples: "02", "6", "33"
 */
export function parseOurRouletteResult(win: string): OurRouletteResult | null {
  if (!win) return null;

  const num = Number(win);
  if (Number.isNaN(num) || num < 0 || num > 36) return null;

  const result: OurRouletteResult = {
    winNumber: num,
    winString: win.padStart(2, "0"),
  };

  console.log("🎯 [OurRoulette Parsed]", result);
  return result;
}

/* =====================================================
   ROULETTE HELPERS
===================================================== */

const RED_NUMBERS = new Set([
  1,3,5,7,9,12,14,16,18,
  19,21,23,25,27,30,32,34,36
]);

const BLACK_NUMBERS = new Set([
  2,4,6,8,10,11,13,15,17,
  20,22,24,26,28,29,31,33,35
]);

/* =====================================================
   BET MATCHING
===================================================== */

export function isWinningOurRouletteBet(
  bet: { n: string },
  result: OurRouletteResult
): boolean {
  if (!bet?.n) return false;

  const betName = bet.n.trim().toLowerCase();
  const win = result.winNumber;

  // ---------- Single / Split / Street / Corner ----------
  if (betName.includes(",")) {
    const nums = betName
      .split(",")
      .map(n => Number(n.trim()))
      .filter(n => !Number.isNaN(n));

    return nums.includes(win);
  }

  // ---------- Single ----------
  if (/^\d+$/.test(betName)) {
    return Number(betName) === win;
  }

  // ---------- Dozens ----------
  if (betName === "1st 12") return win >= 1 && win <= 12;
  if (betName === "2nd 12") return win >= 13 && win <= 24;
  if (betName === "3rd 12") return win >= 25 && win <= 36;

  // ---------- Columns ----------
  if (betName === "1st column") return win % 3 === 1;
  if (betName === "2nd column") return win % 3 === 2;
  if (betName === "3rd column") return win % 3 === 0 && win !== 0;

  // ---------- Ranges ----------
  if (betName === "1 to 18") return win >= 1 && win <= 18;
  if (betName === "19 to 36") return win >= 19 && win <= 36;

  // ---------- Odd / Even ----------
  if (betName === "odd") return win % 2 === 1;
  if (betName === "even") return win !== 0 && win % 2 === 0;

  // ---------- Colors ----------
  if (betName === "red") return RED_NUMBERS.has(win);
  if (betName === "black") return BLACK_NUMBERS.has(win);

  return false;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatOurRouletteLast10(res: any[]) {
  if (!Array.isArray(res)) return [];

  return res.map(r => ({
    mid: r.mid,
    result: r.win?.toString().padStart(2, "0") ?? "-"
  }));
}
