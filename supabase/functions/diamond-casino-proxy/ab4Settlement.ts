/* =====================================================
   TYPES
===================================================== */

export interface AB4Result {
  winnerSide: "ANDAR" | "BAHAR";
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isAB4Table(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") return false;
  return tableId.toLowerCase() === "ab4";
}

/* =====================================================
   PARSE RESULT
===================================================== */
/**
 * ab4 me win hamesha "0" aata hai
 * actual decision cards se hota hai
 */
export function parseAB4Result(
  win: string,
  cards: string
): AB4Result | null {
  if (win !== "0") return null;
  if (!cards) return null;

  const cardList = cards.split(",").map(c => c.trim()).filter(Boolean);
  if (cardList.length < 2) return null;

  /**
   * Rule:
   * - First card = Joker
   * - Next cards alternate:
   *   Andar (index 1), Bahar (index 2), Andar (3)...
   * - Jo side pe same rank ka card pehle aata hai → winner
   */
  const jokerRank = cardList[0].slice(0, -2); // e.g. "A", "10", "K"

  for (let i = 1; i < cardList.length; i++) {
    const rank = cardList[i].slice(0, -2);

    if (rank === jokerRank) {
      const winnerSide = i % 2 === 1 ? "ANDAR" : "BAHAR";

      const result: AB4Result = { winnerSide };
      console.log("🃏 [AB4 Parsed]", result);
      return result;
    }
  }

  return null;
}

/* =====================================================
   BET MATCHING
===================================================== */
/**
 * Supports:
 *  - Andar A / Andar 2 / Andar K ...
 *  - Bahar A / Bahar 2 / Bahar K ...
 */
export function isWinningAB4Bet(
  bet: { nat: string },
  result: AB4Result
): boolean {
  if (!bet?.nat) return false;

  const betName = bet.nat.toLowerCase();

  if (result.winnerSide === "ANDAR") {
    return betName.startsWith("andar");
  }

  if (result.winnerSide === "BAHAR") {
    return betName.startsWith("bahar");
  }

  return false;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatAB4Last10(res: any[]) {
  if (!Array.isArray(res)) return [];

  return res.map(r => ({
    mid: r.mid,
    result: r.win === "0" ? "✓" : "-"
  }));
}
