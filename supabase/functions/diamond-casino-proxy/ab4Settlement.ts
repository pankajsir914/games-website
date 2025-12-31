/* =====================================================
   AB4 (ANDAR BAHAR 150 CARDS) SETTLEMENT
===================================================== */

/**
 * GAME FACTS (CONFIRMED FROM API)
 * --------------------------------
 * - win field hamesha "0" hota hai
 * - actual decision cards se hota hai
 * - first card = Joker
 * - cards alternate:
 *    index 1 -> ANDAR
 *    index 2 -> BAHAR
 *    index 3 -> ANDAR ...
 * - jis side pe Joker rank pehle aata hai -> winner
 */

export type AB4Side = "ANDAR" | "BAHAR";

export interface AB4Result {
  winnerSide: AB4Side;
  jokerRank: string;
  matchedCard: string;
  matchedIndex: number;
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isAB4Table(tableId: string): boolean {
  return typeof tableId === "string" && tableId.toLowerCase() === "ab4";
}

/* =====================================================
   INTERNAL HELPERS
===================================================== */

/** "KSS" -> "K", "10DD" -> "10" */
function extractRank(card: string): string {
  return card.slice(0, -2);
}

/** index based side */
function getSideByIndex(index: number): AB4Side {
  return index % 2 === 1 ? "ANDAR" : "BAHAR";
}

/* =====================================================
   PARSE RESULT (CORE LOGIC)
===================================================== */

export function parseAB4Result(
  win: string,
  cards: string
): AB4Result | null {
  /**
   * API GUARANTEE:
   * - win always "0"
   * - cards string always present on settlement
   */
  if (win !== "0") return null;
  if (!cards) return null;

  const cardList = cards
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  if (cardList.length < 2) return null;

  // First card is Joker
  const jokerCard = cardList[0];
  const jokerRank = extractRank(jokerCard);

  /**
   * Start from index = 1
   * index 1 -> ANDAR
   * index 2 -> BAHAR
   */
  for (let i = 1; i < cardList.length; i++) {
    const card = cardList[i];
    const rank = extractRank(card);

    if (rank === jokerRank) {
      const winnerSide = getSideByIndex(i);

      const result: AB4Result = {
        winnerSide,
        jokerRank,
        matchedCard: card,
        matchedIndex: i,
      };

      console.log("🃏 [AB4 Parsed Result]", result);
      return result;
    }
  }

  return null;
}

/* =====================================================
   BET MATCHING
===================================================== */
/**
 * Bet formats supported:
 *  - "Andar A"
 *  - "Andar 10"
 *  - "Bahar K"
 */

export function isWinningAB4Bet(
  bet: { nat?: string },
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
   20% REFUND (PUSH) LOGIC
===================================================== */
/**
 * Rule:
 * - Agar next card me joker rank aaye (opposite side)
 * - To 20% refund (80% loss)
 */

export function isAB4RefundCase(
  bet: { nat?: string },
  cards: string
): boolean {
  if (!bet?.nat || !cards) return false;

  const cardList = cards.split(",").map((c) => c.trim());
  if (cardList.length < 2) return false;

  const jokerRank = extractRank(cardList[0]);

  // Check only NEXT card
  const nextCard = cardList[1];
  const nextRank = extractRank(nextCard);

  return nextRank === jokerRank;
}

/* =====================================================
   LAST 10 RESULT FORMAT (UI FRIENDLY)
===================================================== */

export function formatAB4Last10(res: any[]) {
  if (!Array.isArray(res)) return [];

  return res.map((r) => ({
    mid: r.mid,
    result: r.win === "0" ? "✓" : "-",
  }));
}
