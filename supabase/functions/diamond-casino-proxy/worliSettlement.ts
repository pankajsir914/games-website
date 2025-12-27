/* =====================================================
   Worli Matka Settlement
===================================================== */

export interface WorliResult {
  mid?: string | number;
  patti: string;          // "378"
  digits: number[];       // [3,7,8]
  single: number;         // 8
}

/* ================= TABLE CHECK ================= */

export function isWorliTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "worli";
}

/* ================= PARSE RESULT ================= */

export function parseWorliResult(
  rdesc: string,
  win: string,
  mid?: string | number
): WorliResult | null {
  if (!rdesc) return null;

  // Example rdesc: "378#8"
  const [patti, singleStr] = rdesc.split("#");

  const digits = patti.split("").map(Number);
  const single = Number(singleStr);

  const result: WorliResult = {
    mid,
    patti,
    digits,
    single,
  };

  console.log("🎯 [WORLI Parsed]", result);
  return result;
}

/* ================= BET CHECK ================= */

export function isWinningWorliBet(
  bet: { sr: number },
  result: WorliResult
): boolean {
  const sr = bet.sr;

  // Single digit bets (1–9)
  if (sr >= 1 && sr <= 9) {
    return result.digits.includes(sr);
  }

  // Patti bets (example sr 10+)
  if (sr >= 10) {
    // Provider mapping needed if multiple pattis exist
    // Default: exact patti win
    return false;
  }

  return false;
}

/* ================= LAST 10 FORMAT ================= */

export function formatWorliLast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    win: r.win,
  }));
}
