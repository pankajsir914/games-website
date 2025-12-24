/* =====================================================
   CMeter1 (Color Meter 1) Settlement
   ===================================================== */

export interface CMeter1Result {
  mid?: number;
  winnerId: number;          // 1 | 2 | 3 | 4
  winnerName: string;        // Red | Green | Violet | Golden
  cardValue: number | null;   // Card number
  cards: string[];           // Card strings
  attributes: Set<string>;   // normalized attributes for matching
}

/**
 * Check if table is CMeter1 / Color Meter 1
 * Supports: cmeter1, cmeter-1, cmeter 1, color meter
 */
export function isCMeter1Table(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") {
    return false;
  }
  
  const t = tableId.toLowerCase().trim();
  
  return t === "cmeter1" ||
         t.includes("cmeter1") ||
         t.includes("cmeter-1") ||
         t.includes("cmeter 1") ||
         t.includes("color meter");
}

/**
 * Parse CMeter1 result from detail_result.t1
 *
 * Example rdesc:
 * "Red#Odd#Red#Under 7#3"
 */
export function parseCMeter1Result(
  detailResult: {
    mid?: number | string;
    win?: string | number;
    winnat?: string;
    rdesc?: string;
    card?: string;
  } | null | undefined
): CMeter1Result | null {
  if (!detailResult) return null;
  
  const winnerId = Number(detailResult.win);
  const winnerName = detailResult.winnat || "";
  
  if (!winnerId || !winnerName) {
    return null;
  }
  
  const parts = detailResult.rdesc
    ? detailResult.rdesc.split("#").map(p => p.trim()).filter(Boolean)
    : [];
  
  const cards = detailResult.card
    ? detailResult.card.split(",").map(c => c.trim()).filter(Boolean)
    : [];
  
  // Extract numeric card value (last numeric part)
  let cardValue: number | null = null;
  for (const p of parts.reverse()) {
    if (/^\d+$/.test(p)) {
      cardValue = parseInt(p, 10);
      break;
    }
  }
  
  const attributes = new Set<string>();
  
  // Add all rdesc parts
  parts.forEach(p => attributes.add(p.toLowerCase()));
  
  // Winner aliases
  const winnerLower = winnerName.toLowerCase();
  attributes.add(winnerLower);
  
  // Color-based winner IDs
  if (winnerId === 1) {
    attributes.add("red");
    attributes.add("player 1");
    attributes.add("1");
  }
  if (winnerId === 2) {
    attributes.add("green");
    attributes.add("player 2");
    attributes.add("2");
  }
  if (winnerId === 3) {
    attributes.add("violet");
    attributes.add("player 3");
    attributes.add("3");
  }
  if (winnerId === 4) {
    attributes.add("golden");
    attributes.add("player 4");
    attributes.add("4");
  }
  
  // Card-based attributes
  if (cardValue !== null) {
    attributes.add(cardValue.toString());
    attributes.add(`card ${cardValue}`);
    attributes.add(`card${cardValue}`);
    
    if (cardValue % 2 === 0) {
      attributes.add("even");
    } else {
      attributes.add("odd");
    }
    
    if (cardValue <= 7) {
      attributes.add("under 7");
    } else {
      attributes.add("over 7");
    }
  }
  
  // Color detection from card suit
  cards.forEach(c => {
    const suit = c.slice(-2).toUpperCase();
    if (["HH", "DD"].includes(suit)) attributes.add("red");
    if (["SS", "CC"].includes(suit)) attributes.add("black");
  });
  
  return {
    mid: detailResult.mid ? Number(detailResult.mid) : undefined,
    winnerId,
    winnerName,
    cards,
    cardValue,
    attributes,
  };
}

/**
 * Match a single bet against CMeter1 result
 */
export function isCMeter1WinningBet(
  betType: string,
  result: CMeter1Result,
  side: "back" | "lay" = "back"
): boolean {
  if (!betType) return false;
  
  const normalizedBet = betType
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  
  let isMatch = false;
  
  // 1️⃣ Direct attribute match
  if (result.attributes.has(normalizedBet)) {
    isMatch = true;
  }
  
  // 2️⃣ Numeric card bet
  if (!isMatch) {
    const num = parseInt(normalizedBet.replace(/^card\s*/, ""), 10);
    if (!isNaN(num) && result.cardValue === num) {
      isMatch = true;
    }
  }
  
  // BACK = match wins, LAY = opposite wins
  return side === "back" ? isMatch : !isMatch;
}

/**
 * Settle all CMeter1 bets
 */
export function settleCMeter1Bets(
  bets: any[],
  detailResult: {
    mid?: number | string;
    win?: string | number;
    winnat?: string;
    rdesc?: string;
    card?: string;
  }
) {
  const result = parseCMeter1Result(detailResult);
  
  if (!result) {
    throw new Error(
      `CMeter1 result parsing failed: ${JSON.stringify(detailResult)}`
    );
  }
  
  return bets.map(bet => {
    const won = isCMeter1WinningBet(
      bet.bet_type,
      result,
      bet.side || "back"
    );
    
    return {
      ...bet,
      status: won ? "won" : "lost",
      payout:
        won && bet.odds
          ? Number((bet.bet_amount * bet.odds).toFixed(2))
          : 0,
      result_mid: result.mid,
      result_winner: result.winnerName,
    };
  });
}
