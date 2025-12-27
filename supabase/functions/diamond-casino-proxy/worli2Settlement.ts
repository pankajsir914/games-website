/* =====================================================
   Instant Worli (worli2) Settlement
===================================================== */

export interface Worli2Result {
  mid?: string | number;
  digit: number;      // 0–9
  patti?: string;     // "440"
}

/* ================= TABLE CHECK ================= */

export function isWorli2Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "worli2";
}

/* ================= PARSE RESULT ================= */

export function parseWorli2Result(
  win: string,
  rdesc?: string,
  mid?: string | number
): Worli2Result | null {
  if (win === undefined || win === null) return null;

  const digit = Number(win);
  if (Number.isNaN(digit)) return null;

  const patti = rdesc ? rdesc.split("#")[0] : undefined;

  const result: Worli2Result = {
    mid,
    digit,
    patti,
  };

  console.log("⚡ [WORLI2 Parsed]", result);
  return result;
}

/* ================= BET CHECK ================= */

export function isWinningWorli2Bet(
  bet: { sr: number },
  result: Worli2Result
): boolean {
  return bet.sr === result.digit;
}

/* ================= LAST 10 FORMAT ================= */

export function formatWorli2Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    digit: Number(r.win),
  }));
}
