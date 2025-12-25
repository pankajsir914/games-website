// kbcSettlement.ts

/* =====================================================
   TYPES
===================================================== */

export type KBCResult = {
  color?: string;
  oddEven?: string;
  upDown?: string;
  cardJudge?: string;
  suit?: string;
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isKBCTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "kbc";
}

/* =====================================================
   PARSER
===================================================== */

export function parseKBCResult(rdesc?: string): KBCResult {
  if (!rdesc) return {};

  const parts = rdesc.split("#").map(p => p.trim());

  const result: KBCResult = {
    color: parts[0]?.toLowerCase(),        // red / black
    oddEven: parts[1]?.toLowerCase(),     // odd / even
    upDown: parts[2]?.toLowerCase(),      // up / down
    cardJudge: parts[3]?.replace(/\s+/g, "").toLowerCase(), // a23 / 456 / 8910 / jqk
    suit: parts[4]?.toLowerCase()         // spade / heart / club / diamond
  };

  console.log("🎯 [KBC Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isKBCWinningBet(
  betNat: string,
  result: KBCResult,
  side: "back" | "lay" = "back"
): boolean {
  const bet = betNat.toLowerCase().trim();
  let isWin = false;

  if (bet === result.color) isWin = true;
  if (bet === result.oddEven) isWin = true;
  if (bet === result.upDown) isWin = true;
  if (bet === result.cardJudge) isWin = true;
  if (bet === result.suit) isWin = true;

  console.log("🔍 [KBC Match]", {
    betNat,
    isWin,
    result,
    side
  });

  return side === "back" ? isWin : !isWin;
}

/* =====================================================
   LAST 10 RESULTS FORMAT
===================================================== */

export function formatKBCLastResults(results: any[]) {
  return results.map(r => ({
    mid: r.mid,
    result: "✔"
  }));
}
