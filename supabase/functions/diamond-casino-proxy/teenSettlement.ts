/* =====================================================
   TEEN (Teenpatti 1-Day) Settlement
===================================================== */

/* ================= TYPES ================= */

export interface TeenResult {
  winnerId: number;          // 1 | 2
  winnerName: string;        // Player A | Player B
  cards: string[];           // ["6SS","8SS",...]
  rdesc?: string;            // raw description
}

/* ================= TABLE CHECK ================= */

export function isTeenTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "teen";
}

/* ================= PARSE RESULT ================= */

export function parseTeenResult(
  win: string,
  card: string,
  rdesc?: string
): TeenResult | null {
  if (!win) return null;

  const winnerId = Number(win);

  const result: TeenResult = {
    winnerId,
    winnerName: winnerId === 1 ? "Player A" : "Player B",
    cards: card ? card.split(",") : [],
    rdesc,
  };

  console.log("🃏 [TEEN Parsed]", result);
  return result;
}

/* ================= MAIN MATCH BET ================= */

export function isWinningTeenMainBet(
  bet: { nat: string },
  result: TeenResult
): boolean {
  return bet.nat.toLowerCase() === result.winnerName.toLowerCase();
}

/* ================= SUIT BET ================= */

export function isWinningTeenSuitBet(
  bet: { nat: string },
  result: TeenResult
): boolean {
  // Example bet.nat:
  // "Player A Spade", "Player B Heart"

  const betNat = bet.nat.toLowerCase();
  const winner = result.winnerName.toLowerCase();

  if (!betNat.includes(winner)) return false;

  const suitMap: Record<string, string> = {
    spade: "S",
    heart: "H",
    diamond: "D",
    club: "C",
  };

  const suitKey = Object.keys(suitMap).find(s =>
    betNat.includes(s)
  );
  if (!suitKey) return false;

  const suitCode = suitMap[suitKey];

  return result.cards.some(c => c.endsWith(suitCode));
}

/* ================= ODD / EVEN CARD BET ================= */

export function isWinningTeenOddEvenBet(
  bet: { nat: string },
  cardValue: number
): boolean {
  const nat = bet.nat.toLowerCase();

  if (nat.includes("odd")) return cardValue % 2 === 1;
  if (nat.includes("even")) return cardValue % 2 === 0;

  return false;
}

/* ================= CON FANCY BET ================= */

export function isWinningTeenConBet(
  bet: { nat: string },
  rdesc?: string
): boolean {
  if (!rdesc) return false;

  // rdesc example:
  // "A : No  |  B : Yes"

  const nat = bet.nat.toLowerCase();

  if (nat.includes("player a")) {
    return rdesc.toLowerCase().includes("a : yes");
  }

  if (nat.includes("player b")) {
    return rdesc.toLowerCase().includes("b : yes");
  }

  return false;
}

/* ================= LAST 10 FORMAT ================= */

export function formatTeenLast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" : "-"
  }));
}
