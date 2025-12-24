/* =====================================================
   AAA2 (Amar Akbar Anthony 2) Settlement
   ===================================================== */

export interface AAA2Result {
  mid?: number;
  winnerId: number;          // 1 | 2 | 3
  winnerName: string;        // Amar | Akbar | Anthony
  cards: string[];           // ["3HH"]
  cardValue: number | null;  // 3
  attributes: Set<string>;   // normalized attributes for matching
}

/**
 * Check if table is AAA2
 * Supports: aaa2, aaa-2, aaa 2, amar akbar anthony 2
 */
export function isAAA2Table(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") {
    console.warn("⚠️ [AAA2] Invalid tableId:", tableId);
    return false;
  }

  const t = tableId.toLowerCase().trim();

  const isAAA2 =
    t === "aaa2" ||
    t.includes("aaa2") ||
    t.includes("aaa-2") ||
    t.includes("aaa 2") ||
    t.includes("amar akbar anthony");

  console.log("🔍 [AAA2 Detection]", {
    tableId,
    normalized: t,
    isAAA2,
  });

  return isAAA2;
}

/**
 * Parse AAA2 result from detail_result.t1
 *
 * Example rdesc:
 * "Amar#Odd#Red#Under 7#3"
 */
export function parseAAA2Result(
  detailResult: {
    mid?: number | string;
    win?: string | number;
    winnat?: string;
    rdesc?: string;
    card?: string;
  } | null | undefined
): AAA2Result | null {
  if (!detailResult) return null;

  const winnerId = Number(detailResult.win);
  const winnerName = detailResult.winnat || "";

  if (!winnerId || !winnerName) {
    console.warn("⚠️ [AAA2] Invalid result payload:", detailResult);
    return null;
  }

  const parts = detailResult.rdesc
    ? detailResult.rdesc.split("#").map(p => p.trim()).filter(Boolean)
    : [];

  const cards = detailResult.card
    ? detailResult.card.split(",").map(c => c.trim()).filter(Boolean)
    : [];

  // extract numeric card value (last numeric part)
  let cardValue: number | null = null;
  for (const p of parts.reverse()) {
    if (/^\d+$/.test(p)) {
      cardValue = parseInt(p, 10);
      break;
    }
  }

  const attributes = new Set<string>();

  // add all rdesc parts
  parts.forEach(p => attributes.add(p.toLowerCase()));

  // winner aliases
  const winnerLower = winnerName.toLowerCase();
  attributes.add(winnerLower);

  if (winnerId === 1) {
    attributes.add("amar");
    attributes.add("player 1");
    attributes.add("1");
  }
  if (winnerId === 2) {
    attributes.add("akbar");
    attributes.add("player 2");
    attributes.add("2");
  }
  if (winnerId === 3) {
    attributes.add("anthony");
    attributes.add("player 3");
    attributes.add("3");
  }

  // card based attributes
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

  // color detection from card suit
  cards.forEach(c => {
    const suit = c.slice(-2).toUpperCase();
    if (["HH", "DD"].includes(suit)) attributes.add("red");
    if (["SS", "CC"].includes(suit)) attributes.add("black");
  });

  console.log("🎯 [AAA2 Result Parsed]", {
    mid: detailResult.mid,
    winnerId,
    winnerName,
    parts,
    cards,
    cardValue,
    attributes: Array.from(attributes),
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
 * Match a single bet against AAA2 result
 */
export function isAAA2WinningBet(
  betType: string,
  result: AAA2Result,
  side: "back" | "lay" = "back"
): boolean {
  if (!betType) return false;

  const normalizedBet = betType
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  let isMatch = false;

  // 1️⃣ direct attribute match
  if (result.attributes.has(normalizedBet)) {
    isMatch = true;
  }

  // 2️⃣ numeric card bet
  if (!isMatch) {
    const num = parseInt(normalizedBet.replace(/^card\s*/, ""), 10);
    if (!isNaN(num) && result.cardValue === num) {
      isMatch = true;
    }
  }

  console.log("🔍 [AAA2 Match]", {
    betType,
    normalizedBet,
    winner: result.winnerName,
    cardValue: result.cardValue,
    attributes: Array.from(result.attributes),
    isMatch,
    side,
  });

  // BACK = match wins, LAY = opposite wins
  return side === "back" ? isMatch : !isMatch;
}

/**
 * Settle all AAA2 bets
 */
export function settleAAA2Bets(
  bets: any[],
  detailResult: {
    mid?: number | string;
    win?: string | number;
    winnat?: string;
    rdesc?: string;
    card?: string;
  }
) {
  const result = parseAAA2Result(detailResult);

  if (!result) {
    throw new Error(
      `AAA2 result parsing failed: ${JSON.stringify(detailResult)}`
    );
  }

  return bets.map(bet => {
    const won = isAAA2WinningBet(
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
