// ab20Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export type AB20Result = {
  lastCard: string;     // "JSS"
  rank: string;         // "J"
  side: "andar" | "bahar";
  isFirstBahar: boolean;
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isAB20Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "ab20";
}

/* =====================================================
   HELPERS
===================================================== */

function extractRank(card: string): string {
  return card.slice(0, card.length - 2); // "10HH" -> "10"
}

/* =====================================================
   RESULT PARSER
===================================================== */

export function parseAB20Result(
  cardString: string | null,
  ares?: string,
  bres?: string
): AB20Result | null {
  if (!cardString) return null;

  const cards = cardString.split(",").map(c => c.trim()).filter(Boolean);
  if (!cards.length) return null;

  const lastCard = cards[cards.length - 1];
  const rank = extractRank(lastCard);

  // ares / bres array tells which side won
  const andarHits = ares ? ares.split(",").map(Number) : [];
  const baharHits = bres ? bres.split(",").map(Number) : [];

  const isBahar = baharHits.some(v => v > 0);
  const isFirstBahar = isBahar && baharHits.findIndex(v => v > 0) === 0;

  return {
    lastCard,
    rank,
    side: isBahar ? "bahar" : "andar",
    isFirstBahar,
  };
}

/* =====================================================
   BET MATCHING + PAYOUT
===================================================== */

export function settleAB20Bet(
  betType: string,
  result: AB20Result
) {
  const bet = betType.toLowerCase().trim();
  const rank = result.rank.toLowerCase();

  let isWin = false;
  let payoutMultiplier = 0;

  if (bet.startsWith("andar")) {
    const v = bet.replace("andar", "").trim();
    isWin = result.side === "andar" && v === rank;
    payoutMultiplier = isWin ? 1 : 0;
  }

  if (bet.startsWith("bahar")) {
    const v = bet.replace("bahar", "").trim();
    isWin = result.side === "bahar" && v === rank;

    if (isWin) {
      payoutMultiplier = result.isFirstBahar ? 0.25 : 1;
    }
  }

  return {
    isWin,
    payoutMultiplier,
  };
}

/* =====================================================
   LAST 10 RESULTS FORMAT
===================================================== */

export function formatAB20LastResults(
  results: Array<{ mid: string | number }>
) {
  return results.map(r => ({
    mid: r.mid,
    result: "-",
  }));
}
