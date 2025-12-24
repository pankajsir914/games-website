// lucky5Settlement.ts

export type Lucky5Result = {
  winningCard: string;     // "1"
  cardNumber: number;      // 1
  attributes: Set<string>;
};

/**
 * Check if table is Lucky5
 */
export function isLucky5Table(tableId: string): boolean {
  return tableId.toLowerCase().includes("lucky5");
}

/**
 * Normalize helper
 */
function normalize(v: string): string {
  return v.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Parse Lucky5 result strictly from rdesc
 * Example: "Low Card#Odd#Red#1"
 */
export function parseLucky5Result(rdesc: string): Lucky5Result | null {
  if (!rdesc) return null;

  const parts = rdesc
    .split("#")
    .map(p => normalize(p))
    .filter(Boolean);

  if (parts.length === 0) return null;

  // Extract numeric card
  const cardPart = parts.find(p => /^\d+$/.test(p));
  if (!cardPart) return null;

  const cardNumber = parseInt(cardPart, 10);

  const attributes = new Set<string>();

  // Add all rdesc attributes
  parts.forEach(p => attributes.add(p));

  // Add numeric matches
  attributes.add(cardNumber.toString());
  attributes.add(`card ${cardNumber}`);

  // Add High / Low logic (IMPORTANT)
  if (cardNumber >= 1 && cardNumber <= 5) {
    attributes.add("low card");
  } else {
    attributes.add("high card");
  }

  console.log("🎯 [Lucky5 Parsed]", {
    rdesc,
    attributes: Array.from(attributes)
  });

  return {
    winningCard: cardPart,
    cardNumber,
    attributes
  };
}

/**
 * Match a single bet
 */
export function isLucky5WinningBet(
  betType: string,
  result: Lucky5Result,
  side: "back" | "lay" = "back"
): boolean {
  const bet = normalize(betType);

  const isMatch = result.attributes.has(bet);

  console.log("🔍 [Lucky5 Match]", {
    betType,
    normalizedBet: bet,
    isMatch,
    attributes: Array.from(result.attributes)
  });

  // BACK = match wins
  if (side === "back") return isMatch;

  // LAY = non-match wins
  return !isMatch;
}

/**
 * Settle all Lucky5 bets
 */
export function settleLucky5Bets(
  bets: any[],
  rdesc: string
) {
  const result = parseLucky5Result(rdesc);

  if (!result) {
    throw new Error(`Lucky5 result parsing failed: ${rdesc}`);
  }

  return bets.map(bet => {
    const won = isLucky5WinningBet(
      bet.bet_type,
      result,
      "back" // 🔥 Lucky5 is always BACK
    );

    return {
      ...bet,
      status: won ? "won" : "lost",
      payout:
        won && bet.odds
          ? Number((bet.bet_amount * bet.odds).toFixed(2))
          : 0
    };
  });
}
