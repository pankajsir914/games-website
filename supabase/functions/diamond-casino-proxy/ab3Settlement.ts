/* =====================================================
   ANDAR BAHAR 50 CARDS (AB3) – SETTLEMENT ENGINE
===================================================== */

/* =====================================================
   TYPES
===================================================== */

export type AndarBaharSide = "andar" | "bahar";

export interface Ab3GameResult {
  winningSide: AndarBaharSide; // andar | bahar
  winningCardIndex: number;    // 1 – 50
  isPush: boolean;             // true if card > 50
}

export interface Ab3Bet {
  side: AndarBaharSide;        // andar | bahar
  cardIndex: number;           // 1 – 46 (allowed betting)
  stake: number;               // bet amount
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isAb3Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "ab3";
}

/* =====================================================
   RESULT PARSER
===================================================== */
/**
 * You MUST provide:
 * - winningSide   → "andar" | "bahar"
 * - winningCardNo → card position (1–50)
 */
export function parseAb3Result(
  winningSide: AndarBaharSide,
  winningCardIndex: number
): Ab3GameResult {

  const isPush = winningCardIndex > 50;

  return {
    winningSide,
    winningCardIndex,
    isPush
  };
}

/* =====================================================
   PAYOUT CALCULATION (CORE LOGIC)
===================================================== */

export function calculateAb3Payout(
  bet: Ab3Bet,
  result: Ab3GameResult
): {
  isWin: boolean;
  payoutAmount: number;
  isPush: boolean;
} {

  /* ================= PUSH CASE ================= */
  if (result.isPush || bet.cardIndex > 50) {
    return {
      isWin: false,
      payoutAmount: bet.stake, // stake returned
      isPush: true
    };
  }

  /* ================= CARD MATCH ================= */
  const isCorrectCard =
    bet.cardIndex === result.winningCardIndex;

  const isCorrectSide =
    bet.side === result.winningSide;

  if (!isCorrectCard || !isCorrectSide) {
    return {
      isWin: false,
      payoutAmount: 0,
      isPush: false
    };
  }

  /* =====================================================
     PAYOUT RULES
  ===================================================== */

  let payoutMultiplier = 1; // default 100%

  /**
   * RULE 7 – Bahar side special payout
   */
  if (result.winningSide === "bahar") {
    // First card = cardIndex === 1
    if (bet.cardIndex === 1) {
      if (bet.cardIndex >= 1 && bet.cardIndex <= 31) {
        payoutMultiplier = 0.25; // 25%
      }
      if (bet.cardIndex >= 33 && bet.cardIndex <= 45) {
        payoutMultiplier = 0.20; // 20%
      }
    }
  }

  /**
   * RULE 8 – Andar side
   * Only Bahar betting allowed, always 100%
   */
  if (result.winningSide === "andar") {
    payoutMultiplier = 1; // 100%
  }

  return {
    isWin: true,
    payoutAmount: bet.stake * payoutMultiplier,
    isPush: false
  };
}

/* =====================================================
   LAST RESULTS FORMATTER
===================================================== */

export function formatAb3LastResults(
  results: Array<{
    mid: string | number;
    winningSide: AndarBaharSide;
    winningCardIndex: number;
  }>
) {
  return results.map(r => ({
    mid: r.mid,
    result: `${r.winningSide.toUpperCase()} – Card ${r.winningCardIndex}`
  }));
}
