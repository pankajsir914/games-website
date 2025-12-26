/* =====================================================
   TEEN30 (30-30 Teenpatti) Settlement
===================================================== */

/* ================= TYPES ================= */

export interface Teen30Result {
  winnerId: number;          // 1 | 2
  winnerName: string;        // Player A | Player B
  cards: string[];           // ["6SS","8DD",...]
  rdesc?: string;            // raw description (optional)
}

/* ================= TABLE CHECK ================= */

export function isTeen30Table(tableId: string): boolean {
  if (!tableId || typeof tableId !== "string") return false;

  const t = tableId.toLowerCase().trim();
  return (
    t === "teen30" ||
    t.includes("teen30") ||
    t.includes("30-30") ||
    t.includes("30 30")
  );
}

/* ================= PARSE RESULT ================= */

export function parseTeen30Result(
  win: string,
  card: string,
  rdesc?: string
): Teen30Result | null {
  if (!win) return null;

  const winnerId = Number(win);

  const result: Teen30Result = {
    winnerId,
    winnerName: winnerId === 1 ? "Player A" : "Player B",
    cards: card ? card.split(",") : [],
    rdesc,
  };

  console.log("🃏 [TEEN30 Parsed]", result);
  return result;
}

/* ================= MAIN MATCH BET ================= */

export function isWinningTeen30MainBet(
  bet: { nat: string },
  result: Teen30Result
): boolean {
  return (
    bet.nat?.toLowerCase() === result.winnerName.toLowerCase()
  );
}

/* ================= SUIT BET ================= */

export function isWinningTeen30SuitBet(
  bet: { nat: string },
  result: Teen30Result
): boolean {
  // Example nat:
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

/* ================= ODD / EVEN BET ================= */

export function isWinningTeen30OddEvenBet(
  bet: { nat: string },
  cardValue: number
): boolean {
  const nat = bet.nat.toLowerCase();

  if (nat.includes("odd")) return cardValue % 2 === 1;
  if (nat.includes("even")) return cardValue % 2 === 0;

  return false;
}

/* ================= CON / YES-NO FANCY ================= */

export function isWinningTeen30ConBet(
  bet: { nat: string },
  rdesc?: string
): boolean {
  if (!rdesc) return false;

  // rdesc example:
  // "A : No | B : Yes"

  const nat = bet.nat.toLowerCase();
  const desc = rdesc.toLowerCase();

  if (nat.includes("player a")) {
    return desc.includes("a : yes");
  }

  if (nat.includes("player b")) {
    return desc.includes("b : yes");
  }

  return false;
}

/* ================= LAST 10 FORMAT ================= */

export function formatTeen30Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" : "-"
  }));
}
