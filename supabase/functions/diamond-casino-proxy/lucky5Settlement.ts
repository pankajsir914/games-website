// lucky5Settlement.ts

export type Lucky5Result = {
  winningCard: string;          // "1"
  cardNumber: number;           // 1
  attributes: Set<string>;      // all winning attributes
};

/**
 * Check if table is Lucky5
 */
export function isLucky5Table(tableId: string): boolean {
  return tableId.toLowerCase().includes('lucky5');
}

/**
 * Parse Lucky5 result strictly from rdesc
 * Example rdesc:
 * "Low Card#Odd#Red#1"
 */
export function parseLucky5Result(rdesc: string): Lucky5Result | null {
  if (!rdesc) return null;

  const parts = rdesc
    .split('#')
    .map(p => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;

  // Extract numeric card (last truth)
  const cardPart = parts.find(p => /^\d+$/.test(p));
  if (!cardPart) return null;

  const cardNumber = parseInt(cardPart, 10);

  // Normalize attributes
  const attributes = new Set(
    parts.map(p => p.toLowerCase())
  );

  // Add normalized card labels
  attributes.add(`card ${cardNumber}`);
  attributes.add(cardNumber.toString());

  return {
    winningCard: cardPart,
    cardNumber,
    attributes
  };
}

/**
 * Match a single bet against Lucky5 result
 */
export function isLucky5WinningBet(
  betType: string,
  result: Lucky5Result,
  side: 'back' | 'lay' = 'back'
): boolean {
  const bet = betType.toLowerCase().trim();

  const isMatch = result.attributes.has(bet);

  // BACK = match wins
  if (side === 'back') return isMatch;

  // LAY = non-match wins
  return !isMatch;
}

/**
 * Settle all Lucky5 bets (optional helper)
 */
export function settleLucky5Bets(
  bets: any[],
  rdesc: string
) {
  const result = parseLucky5Result(rdesc);

  if (!result) {
    throw new Error(`Lucky5 result parsing failed for rdesc: ${rdesc}`);
  }

  return bets.map(bet => {
    const won = isLucky5WinningBet(
      bet.bet_type,
      result,
      bet.side || 'back'
    );

    return {
      ...bet,
      status: won ? 'won' : 'lost',
      payout:
        won && bet.odds
          ? Number((bet.bet_amount * bet.odds).toFixed(2))
          : 0
    };
  });
}
