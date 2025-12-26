/* =====================================================
   DT20 (20-20 Dragon Tiger) Settlement
===================================================== */

/* ================= TYPES ================= */

export interface DT20Result {
  winner: "Dragon" | "Tiger" | "Tie";
  pair: boolean;

  dragonOdd?: boolean;
  dragonEven?: boolean;
  dragonRed?: boolean;
  dragonBlack?: boolean;
  dragonCard?: string;

  tigerOdd?: boolean;
  tigerEven?: boolean;
  tigerRed?: boolean;
  tigerBlack?: boolean;
  tigerCard?: string;

  cards: string[];
  rdesc?: string;
}

/* ================= TABLE CHECK ================= */

export function isDT20Table(tableId: string): boolean {
  if (!tableId) return false;
  const t = tableId.toLowerCase();
  return t === "dt20" || t.includes("dt20");
}

/* ================= PARSE RESULT ================= */

export function parseDT20Result(
  win: string,
  card: string,
  rdesc?: string
): DT20Result | null {
  if (!win || !rdesc) return null;

  const winnerMap: Record<string, DT20Result["winner"]> = {
    "1": "Dragon",
    "2": "Tiger",
    "3": "Tie",
  };

  const winner = winnerMap[win];
  if (!winner) return null;

  const parts = rdesc.split("#").map(p => p.trim());

  // Example:
  // Tie#Yes#D : Odd  |  T : Odd#D : Red  |  T : Red#D : J  |  T : J

  const pair = parts[1]?.toLowerCase() === "yes";

  const oddEven = parts[2];
  const color = parts[3];
  const cardRank = parts[4];

  const result: DT20Result = {
    winner,
    pair,
    cards: card ? card.split(",") : [],
    rdesc,
  };

  if (oddEven) {
    result.dragonOdd = oddEven.includes("D : Odd");
    result.dragonEven = oddEven.includes("D : Even");
    result.tigerOdd = oddEven.includes("T : Odd");
    result.tigerEven = oddEven.includes("T : Even");
  }

  if (color) {
    result.dragonRed = color.includes("D : Red");
    result.dragonBlack = color.includes("D : Black");
    result.tigerRed = color.includes("T : Red");
    result.tigerBlack = color.includes("T : Black");
  }

  if (cardRank) {
    const dMatch = cardRank.match(/D\s*:\s*([0-9JQKA]+)/i);
    const tMatch = cardRank.match(/T\s*:\s*([0-9JQKA]+)/i);

    if (dMatch) result.dragonCard = dMatch[1];
    if (tMatch) result.tigerCard = tMatch[1];
  }

  console.log("🐉🐯 [DT20 Parsed]", result);
  return result;
}

/* ================= MAIN BET ================= */

export function isWinningDT20MainBet(
  bet: { nat: string },
  result: DT20Result
): boolean {
  return bet.nat.toLowerCase() === result.winner.toLowerCase();
}

/* ================= PAIR ================= */

export function isWinningDT20PairBet(
  bet: { nat: string },
  result: DT20Result
): boolean {
  return bet.nat.toLowerCase() === "pair" && result.pair;
}

/* ================= ODD / EVEN ================= */

export function isWinningDT20OddEvenBet(
  bet: { nat: string },
  result: DT20Result
): boolean {
  const nat = bet.nat.toLowerCase();

  if (nat === "dragon odd") return !!result.dragonOdd;
  if (nat === "dragon even") return !!result.dragonEven;
  if (nat === "tiger odd") return !!result.tigerOdd;
  if (nat === "tiger even") return !!result.tigerEven;

  return false;
}

/* ================= RED / BLACK ================= */

export function isWinningDT20ColorBet(
  bet: { nat: string },
  result: DT20Result
): boolean {
  const nat = bet.nat.toLowerCase();

  if (nat === "dragon red") return !!result.dragonRed;
  if (nat === "dragon black") return !!result.dragonBlack;
  if (nat === "tiger red") return !!result.tigerRed;
  if (nat === "tiger black") return !!result.tigerBlack;

  return false;
}

/* ================= CARD RANK ================= */

export function isWinningDT20CardBet(
  bet: { nat: string },
  result: DT20Result
): boolean {
  const nat = bet.nat.toLowerCase();

  if (nat.startsWith("dragon card")) {
    const rank = nat.replace("dragon card", "").trim().toUpperCase();
    return result.dragonCard === rank;
  }

  if (nat.startsWith("tiger card")) {
    const rank = nat.replace("tiger card", "").trim().toUpperCase();
    return result.tigerCard === rank;
  }

  return false;
}

/* ================= LAST 10 FORMAT ================= */

export function formatDT20Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "D" :
      r.win === "2" ? "T" :
      r.win === "3" ? "Tie" : "-"
  }));
}
