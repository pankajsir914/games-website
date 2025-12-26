/* =====================================================
   ABJ (Andar Bahar Joker / Andar Bahar 2) Settlement
===================================================== */

export type ABJWinner = "Andar" | "Bahar";

export interface ABJResult {
  winner: ABJWinner;
  jokerSuit?: string;
  jokerOddEven?: "Odd" | "Even";
  jokerValue?: string; // A,2-10,J,Q,K
  cards: string[];
  rdesc?: string;
  mid?: string | number;
}

/* ================= TABLE CHECK ================= */

export function isABJTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "abj";
}

/* ================= PARSE RESULT ================= */

export function parseABJResult(
  win: string,
  card: string,
  rdesc?: string,
  mid?: string | number
): ABJResult | null {
  if (!win || !rdesc) return null;

  const winner: ABJWinner = win === "1" ? "Andar" : "Bahar";

  const parts = rdesc.split("#");

  const result: ABJResult = {
    winner,
    jokerSuit: parts[1],
    jokerOddEven: parts[2] as "Odd" | "Even",
    jokerValue: parts[3],
    cards: card ? card.split(",") : [],
    rdesc,
    mid,
  };

  console.log("🃏 [ABJ Parsed]", result);
  return result;
}

/* ================= MAIN WINNER ================= */

export function isWinningABJMain(
  bet: { nat: string },
  result: ABJResult
): boolean {
  if (bet.nat === "SA") return result.winner === "Andar";
  if (bet.nat === "SB") return result.winner === "Bahar";
  return false;
}

/* ================= JOKER NUMBER ================= */

export function isWinningABJJokerNumber(
  bet: { nat: string },
  result: ABJResult
): boolean {
  if (!bet.nat.startsWith("Joker")) return false;

  const value = bet.nat.replace("Joker", "").trim();
  return value === result.jokerValue;
}

/* ================= JOKER SUIT ================= */

export function isWinningABJJokerSuit(
  bet: { nat: string },
  result: ABJResult
): boolean {
  if (!bet.nat.startsWith("Joker")) return false;

  const suit = bet.nat.replace("Joker", "").trim();
  return suit === result.jokerSuit;
}

/* ================= JOKER ODD / EVEN ================= */

export function isWinningABJJokerOddEven(
  bet: { nat: string },
  result: ABJResult
): boolean {
  if (bet.nat === "Joker Odd")
    return result.jokerOddEven === "Odd";

  if (bet.nat === "Joker Even")
    return result.jokerOddEven === "Even";

  return false;
}

/* ================= POSITION BET (OPTIONAL) ================= */
/* Enable later if backend sends position info */

export function isWinningABJPosition(
  bet: { nat: string },
  _result: ABJResult
): boolean {
  // Placeholder: API does not expose exact position yet
  return false;
}

/* ================= LAST 10 FORMAT ================= */

export function formatABJLast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result: r.win === "1" ? "A" : "B",
  }));
}
