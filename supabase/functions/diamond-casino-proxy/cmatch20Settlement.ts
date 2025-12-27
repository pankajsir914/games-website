/* =====================================================
   Cricket Match 20-20 (cmatch20) Settlement
===================================================== */

export interface CMatch20Result {
  mid?: string | number;
  run: number; // 1–10
}

/* ================= TABLE CHECK ================= */

export function isCMatch20Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "cmatch20";
}

/* ================= PARSE RESULT ================= */

export function parseCMatch20Result(
  win: string,
  mid?: string | number
): CMatch20Result | null {

  if (!win) return null;

  const run = Number(win);
  if (Number.isNaN(run)) return null;

  const result: CMatch20Result = {
    mid,
    run,
  };

  console.log("🏏 [CMATCH20 Parsed]", result);
  return result;
}

/* ================= BET CHECK ================= */

export function isWinningCMatch20Bet(
  bet: { sr: number },
  result: CMatch20Result
): boolean {
  /**
   * sr mapping:
   * Run 2  → sr 1
   * Run 3  → sr 2
   * ...
   * Run 10 → sr 9
   */

  return bet.sr === result.run - 1;
}

/* ================= LAST 10 FORMAT ================= */

export function formatCMatch20Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    run: Number(r.win),
  }));
}
