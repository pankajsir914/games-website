/* =====================================================
   TYPES
===================================================== */

export interface Teen42Result {
  winnerId: number;        // 1 | 2
  winnerName: string;      // Player A | Player B
  bTotal?: number;         // Player B card total
  bRange?: "UNDER_21" | "OVER_21";
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isTeen42Table(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") return false;
  return tableId.toLowerCase() === "teen42";
}

/* =====================================================
   PARSE RESULT
===================================================== */
/**
 * rdesc example:
 *  "Player B#B : Under 21(8)"
 */
export function parseTeen42Result(
  win: string,
  rdesc?: string
): Teen42Result | null {
  if (!win) return null;

  const winnerId = Number(win);
  const winnerName =
    winnerId === 1 ? "Player A" :
    winnerId === 2 ? "Player B" : null;

  if (!winnerName) return null;

  let bTotal: number | undefined;
  let bRange: "UNDER_21" | "OVER_21" | undefined;

  if (rdesc && rdesc.includes("#")) {
    const [, fancyPart] = rdesc.split("#");

    const totalMatch = fancyPart.match(/\((\d+)\)/);
    if (totalMatch) {
      bTotal = Number(totalMatch[1]);
      bRange = bTotal < 21 ? "UNDER_21" : "OVER_21";
    }
  }

  const result: Teen42Result = {
    winnerId,
    winnerName,
    bTotal,
    bRange,
  };

  console.log("🃏 [Teen42 Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */
/**
 * Supports:
 *  - Player A / Player B
 *  - Player B Under 21
 *  - Player B Over 21
 */
export function isWinningTeen42Bet(
  bet: { nat: string; subtype?: string },
  result: Teen42Result
): boolean {
  if (!bet?.nat) return false;

  const betName = bet.nat.toLowerCase();

  // ---- Main match ----
  if (bet.subtype === "teen42") {
    return betName === result.winnerName.toLowerCase();
  }

  // ---- Fancy Under / Over ----
  if (bet.subtype === "uo" && result.bRange) {
    if (betName.includes("under 21") && result.bRange === "UNDER_21")
      return true;

    if (betName.includes("over 21") && result.bRange === "OVER_21")
      return true;
  }

  return false;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatTeen42Last10(res: any[]) {
  if (!Array.isArray(res)) return [];

  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" : "-"
  }));
}
