/* =====================================================
   Teenpatti 2.0 (teen6) Settlement
===================================================== */

export interface Teen6Result {
  mid?: string | number;
  winner: 1 | 2;          // 1 = Player A, 2 = Player B
  cards: string[];        // 6 cards
  sumA: number;           // Player A total
  sumB: number;           // Player B total
}

/* ================= TABLE CHECK ================= */

export function isTeen6Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "teen6";
}

/* ================= PARSE RESULT ================= */

export function parseTeen6Result(
  win: string,
  cards: string,
  mid?: string | number
): Teen6Result | null {

  const winner = Number(win) as 1 | 2;
  if (winner !== 1 && winner !== 2) return null;

  const cardArr = cards.split(",");

  const sumA = cardArr
    .slice(0, 3)
    .reduce((t, c) => t + getCardValue(c), 0);

  const sumB = cardArr
    .slice(3, 6)
    .reduce((t, c) => t + getCardValue(c), 0);

  return {
    mid,
    winner,
    cards: cardArr,
    sumA,
    sumB,
  };
}

/* ================= MAIN MATCH ================= */

export function isWinningTeen6Match(
  bet: { sr: number },
  result: Teen6Result
): boolean {
  return bet.sr === result.winner;
}

/* ================= SUIT ================= */

export function isWinningTeen6Suit(
  cardIndex: number,
  betSuit: string,
  result: Teen6Result
): boolean {
  return getSuit(result.cards[cardIndex]) === betSuit;
}

/* ================= ODD / EVEN ================= */

export function isWinningTeen6OddEven(
  cardIndex: number,
  bet: "Odd" | "Even",
  result: Teen6Result
): boolean {
  const odd = isOdd(result.cards[cardIndex]);
  return bet === (odd ? "Odd" : "Even");
}

/* ================= EXACT CARD ================= */

export function isWinningTeen6ExactCard(
  cardIndex: number,
  betRank: string,
  result: Teen6Result
): boolean {
  return result.cards[cardIndex].startsWith(betRank);
}

/* ================= UNDER / OVER ================= */

export function isWinningTeen6UnderOver(
  player: "A" | "B",
  bet: "Under" | "Over",
  limit: number,
  result: Teen6Result
): boolean {
  const sum = player === "A" ? result.sumA : result.sumB;
  return bet === "Under" ? sum < limit : sum > limit;
}
