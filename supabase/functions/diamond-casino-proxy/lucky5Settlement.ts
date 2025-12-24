/**
 * Generic Lucky5 Betting Settlement Engine
 * Patterned after Roulette Engine
 * Fully data-driven, no hardcoding
 */

/* ======================= TYPES ======================= */

export interface Lucky5Result {
  cards: string[];        // ["High Card", "Odd", "Red", "9"]
  winningCard: string;   // "9"
}

export interface UserBet {
  id: string;
  bet_type: string;      // nat (Even, Odd, Red, Card 9, etc.)
  bet_amount: number;
  odds?: number;
  side?: 'back' | 'lay';
}

/* ======================= PARSER ======================= */

/**
 * Parse Lucky5 rdesc
 * Example: "High Card#Odd#Red#9"
 */
export function parseLucky5Result(
  rdesc: string | null | undefined
): Lucky5Result | null {
  if (!rdesc || typeof rdesc !== "string") return null;

  const parts = rdesc
    .split("#")
    .map(p => p.trim())
    .filter(Boolean);

  if (parts.length === 0) return null;

  return {
    cards: parts,
    winningCard: parts[parts.length - 1]
  };
}

/* ======================= NORMALIZER ======================= */

function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/* ======================= MATCH ENGINE ======================= */

/**
 * Decide if bet is winning
 */
export function isLucky5WinningBet(
  betCoverage: string,
  result: Lucky5Result,
  betSide: 'back' | 'lay' = 'back'
): boolean {
  if (!betCoverage) return false;

  const normalizedBet = normalize(betCoverage);
  const normalizedCards = result.cards.map(normalize);

  console.log("🔍 [Lucky5 Match]", {
    betCoverage,
    normalizedBet,
    resultCards: normalizedCards
  });

  let isMatch = false;

  /* ---------- Rule 1: Direct match (Even, Odd, Red, Black, High Card, Low Card) ---------- */
  if (normalizedCards.includes(normalizedBet)) {
    isMatch = true;
  }

  /* ---------- Rule 2: Card X match ---------- */
  // bet: "Card 9" | "Card J"
  if (normalizedBet.startsWith("card")) {
    const betCard = normalizedBet.replace("card", "").trim();
    const winningCard = normalize(result.winningCard);

    if (betCard === winningCard) {
      isMatch = true;
    }
  }

  /* ---------- BACK vs LAY ---------- */
  return betSide === "back" ? isMatch : !isMatch;
}

/* ======================= SETTLEMENT ======================= */

/**
 * Settle Lucky5 bets
 */
export function settleLucky5Bets(
  rdesc: string | null | undefined,
  bets: UserBet[]
): Array<{
  bet: UserBet;
  isWin: boolean;
  payout?: number;
  reason: string;
}> {
  const parsed = parseLucky5Result(rdesc);

  if (!parsed) {
    return bets.map(bet => ({
      bet,
      isWin: false,
      reason: "Invalid or empty rdesc"
    }));
  }

  console.log("🎯 [Lucky5 Result Parsed]", parsed);

  return bets.map(bet => {
    const side = bet.side || "back";

    const isWin = isLucky5WinningBet(
      bet.bet_type,
      parsed,
      side
    );

    const payout =
      isWin && bet.odds
        ? Number((bet.bet_amount * bet.odds).toFixed(2))
        : undefined;

    return {
      bet,
      isWin,
      payout,
      reason: isWin
        ? `Matched "${bet.bet_type}" with result "${parsed.cards.join(", ")}"`
        : `No match for "${bet.bet_type}"`
    };
  });
}
