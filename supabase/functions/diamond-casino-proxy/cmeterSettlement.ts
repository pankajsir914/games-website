/* =====================================================
   Casino Meter (cmeter) Settlement
===================================================== */

export interface CMeterResult {
  mid?: string | number;
  value: 1 | 2; // 1 = Low, 2 = High
}

/* ================= TABLE CHECK ================= */

export function isCMeterTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "cmeter";
}

/* ================= PARSE RESULT ================= */

export function parseCMeterResult(
  win: string,
  mid?: string | number
): CMeterResult | null {

  const value = Number(win) as 1 | 2;
  if (value !== 1 && value !== 2) return null;

  const result: CMeterResult = {
    mid,
    value,
  };

  console.log("🎰 [CMETER Parsed]", result);
  return result;
}

/* ================= BET CHECK ================= */

export function isWinningCMeterBet(
  bet: { sr: number },
  result: CMeterResult
): boolean {
  // sr 1 = Low, sr 2 = High
  return bet.sr === result.value;
}

/* ================= LAST 10 FORMAT ================= */

export function formatCMeterLast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    value: Number(r.win) === 1 ? "Low" : "High",
  }));
}
