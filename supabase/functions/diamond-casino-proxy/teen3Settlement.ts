/* =====================================================
   Teen3 (Instant Teenpatti) Settlement
   ===================================================== */

export interface Teen3Result {
  mid?: number;
  winnerId: string;        // "1" | "2"
  winnerName: string;      // "Player A" | "Player B"
  rdesc?: string;          // usually same as winnerName
  cards?: string[];        // ["KSS","8SS","QHH",...]
  attributes: Set<string>; // normalized attributes for matching
}

/**
 * Check if table is Teen3 / Instant Teenpatti
 * Supports: teen3, teen-3, teen 3, instant teenpatti
 */
export function isTeen3Table(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") {
    console.warn(`⚠️ [Teen3] Invalid tableId:`, tableId);
    return false;
  }

  const t = tableId.toLowerCase().trim();

  const isTeen3 =
    t === "teen3" ||
    t.includes("teen3") ||
    t.includes("teen 3") ||
    t.includes("teen-3") ||
    t.includes("instant teen");

  console.log("🔍 [Teen3 Detection]", {
    tableId,
    normalized: t,
    isTeen3,
  });

  return isTeen3;
}

/**
 * Parse Teen3 result from detail_result API
 *
 * Example detail_result:
 * {
 *   win: "1",
 *   winnat: "Player A",
 *   rdesc: "Player A",
 *   card: "KSS,8SS,QHH,9CC,10DD,QSS"
 * }
 */
export function parseTeen3Result(
  detailResult: {
    mid?: number | string;
    win?: string | number;
    winnat?: string;
    rdesc?: string;
    card?: string;
  } | null | undefined
): Teen3Result | null {
  if (!detailResult) return null;

  const winnerId = detailResult.win?.toString();
  const winnerName =
    detailResult.winnat ||
    detailResult.rdesc ||
    "";

  if (!winnerId || !winnerName) {
    console.warn("⚠️ [Teen3] Invalid result payload:", detailResult);
    return null;
  }

  const cards = detailResult.card
    ? detailResult.card.split(",").map(c => c.trim()).filter(Boolean)
    : [];

  const attributes = new Set<string>();

  // normalize winner name
  attributes.add(winnerName.toLowerCase());
  attributes.add(winnerName.toLowerCase().replace(/\s+/g, ""));

  // common aliases
  if (winnerId === "1") {
    attributes.add("player a");
    attributes.add("playera");
    attributes.add("a");
  }

  if (winnerId === "2") {
    attributes.add("player b");
    attributes.add("playerb");
    attributes.add("b");
  }

  // add cards for reference (optional future use)
  cards.forEach(c => attributes.add(c.toLowerCase()));

  console.log("🎯 [Teen3 Result Parsed]", {
    mid: detailResult.mid,
    winnerId,
    winnerName,
    cards,
    attributes: Array.from(attributes),
  });

  return {
    mid: detailResult.mid ? Number(detailResult.mid) : undefined,
    winnerId,
    winnerName,
    rdesc: detailResult.rdesc,
    cards,
    attributes,
  };
}

/**
 * Match a single bet against Teen3 result
 */
export function isTeen3WinningBet(
  betType: string,
  result: Teen3Result,
  side: "back" | "lay" = "back"
): boolean {
  if (!betType) return false;

  const normalizedBet = betType
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  let isMatch = false;

  // 1️⃣ Direct attribute match (Player A / Player B)
  if (result.attributes.has(normalizedBet)) {
    isMatch = true;
  }

  // 2️⃣ Short aliases (A / B)
  if (!isMatch && (normalizedBet === "a" || normalizedBet === "b")) {
    if (
      (normalizedBet === "a" && result.winnerId === "1") ||
      (normalizedBet === "b" && result.winnerId === "2")
    ) {
      isMatch = true;
    }
  }

  // 3️⃣ Match against winner name directly
  if (
    !isMatch &&
    normalizedBet === result.winnerName.toLowerCase()
  ) {
    isMatch = true;
  }

  console.log("🔍 [Teen3 Match]", {
    betType,
    normalizedBet,
    winnerId: result.winnerId,
    winnerName: result.winnerName,
    attributes: Array.from(result.attributes),
    isMatch,
    side,
  });

  // BACK = match wins, LAY = opposite wins
  return side === "back" ? isMatch : !isMatch;
}

/**
 * Settle all Teen3 bets
 */
export function settleTeen3Bets(
  bets: any[],
  detailResult: {
    mid?: number | string;
    win?: string | number;
    winnat?: string;
    rdesc?: string;
    card?: string;
  }
) {
  const result = parseTeen3Result(detailResult);

  if (!result) {
    throw new Error(
      `Teen3 result parsing failed: ${JSON.stringify(detailResult)}`
    );
  }

  return bets.map(bet => {
    const won = isTeen3WinningBet(
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
