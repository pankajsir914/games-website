// ab20Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export type AB20Result = {
  lastCard: string;   // "JSS"
  rank: string;       // "J"
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isAB20Table(tableId: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase() === "ab20";
}

/* =====================================================
   HELPERS
===================================================== */

function extractRank(card: string): string {
  // "10HH" → "10"
  // "JSS"  → "J"
  return card.slice(0, card.length - 2);
}

/* =====================================================
   RESULT PARSER
===================================================== */

export function parseAB20Result(
  cardString: string | null
): AB20Result | null {

  if (!cardString) return null;

  const cards = cardString
    .split(",")
    .map(c => c.trim())
    .filter(Boolean);

  if (cards.length === 0) return null;

  const lastCard = cards[cards.length - 1];
  const rank = extractRank(lastCard);

  return { lastCard, rank };
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isAB20WinningBet(
  betType: string,
  result: AB20Result,
  side: "back" | "lay" = "back"
): boolean {

  const bet = betType.toLowerCase().trim();
  const rank = result.rank.toLowerCase();

  let isMatch = false;

  // Andar X
  if (bet.startsWith("andar")) {
    const v = bet.replace("andar", "").trim();
    isMatch = v === rank;
  }

  // Bahar X
  if (bet.startsWith("bahar")) {
    const v = bet.replace("bahar", "").trim();
    isMatch = v === rank;
  }

  console.log("🃏 [AB20 Match]", {
    betType,
    rank,
    isMatch
  });

  return side === "back" ? isMatch : !isMatch;
}

/* =====================================================
   LAST 10 RESULTS
===================================================== */

export function formatAB20LastResults(
  results: Array<{ mid: string | number }>
) {
  return results.map(r => ({
    mid: r.mid,
    result: "-"   // AB20 me numeric history meaningless
  }));
}
