/* =====================================================
   DTL20 (20-20 Dragon Tiger Lion) Settlement
===================================================== */

export type DTLWinner = "Dragon" | "Tiger" | "Lion";

export interface DTL20Result {
  winner: DTLWinner;

  dragon: {
    color?: "Red" | "Black";
    odd?: boolean;
    even?: boolean;
    card?: string;
  };

  tiger: {
    color?: "Red" | "Black";
    odd?: boolean;
    even?: boolean;
    card?: string;
  };

  lion: {
    color?: "Red" | "Black";
    odd?: boolean;
    even?: boolean;
    card?: string;
  };

  cards: string[];
  rdesc?: string;
}

/* ================= TABLE CHECK ================= */

export function isDTL20Table(tableId: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase().includes("dtl20");
}

/* ================= PARSER ================= */

export function parseDTL20Result(
  win: string,
  card: string,
  rdesc?: string
): DTL20Result | null {
  if (!win || !rdesc) return null;

  const winnerMap: Record<string, DTLWinner> = {
    "1": "Dragon",
    "21": "Tiger",
    "41": "Lion",
  };

  const winner = winnerMap[win];
  if (!winner) return null;

  const parts = rdesc.split("#").map(p => p.trim());

  const colorPart = parts[1] || "";
  const oddEvenPart = parts[2] || "";
  const cardPart = parts[3] || "";

  const parseColor = (s: string) =>
    s.includes("Black") ? "Black" :
    s.includes("Red") ? "Red" : undefined;

  const parseOddEven = (s: string) => ({
    odd: s.includes("Odd"),
    even: s.includes("Even"),
  });

  const parseCard = (s: string, key: "D" | "T" | "L") => {
    const m = s.match(new RegExp(`${key}\\s*:\\s*([0-9AJQK]+)`, "i"));
    return m?.[1];
  };

  const result: DTL20Result = {
    winner,
    dragon: {
      color: parseColor(colorPart.match(/D\s*:\s*(Black|Red)/i)?.[0] || ""),
      ...parseOddEven(oddEvenPart.match(/D\s*:\s*(Odd|Even)/i)?.[0] || ""),
      card: parseCard(cardPart, "D"),
    },
    tiger: {
      color: parseColor(colorPart.match(/T\s*:\s*(Black|Red)/i)?.[0] || ""),
      ...parseOddEven(oddEvenPart.match(/T\s*:\s*(Odd|Even)/i)?.[0] || ""),
      card: parseCard(cardPart, "T"),
    },
    lion: {
      color: parseColor(colorPart.match(/L\s*:\s*(Black|Red)/i)?.[0] || ""),
      ...parseOddEven(oddEvenPart.match(/L\s*:\s*(Odd|Even)/i)?.[0] || ""),
      card: parseCard(cardPart, "L"),
    },
    cards: card ? card.split(",") : [],
    rdesc,
  };

  console.log("🦁🐯🐉 [DTL20 Parsed]", result);
  return result;
}

/* ================= MAIN WINNER ================= */

export function isWinningDTL20WinnerBet(
  bet: { nat: string },
  result: DTL20Result
): boolean {
  return bet.nat.toLowerCase().includes(result.winner.toLowerCase());
}

/* ================= COLOR ================= */

export function isWinningDTL20ColorBet(
  bet: { nat: string },
  result: DTL20Result
): boolean {
  const nat = bet.nat.toLowerCase();

  if (nat.includes("black d")) return result.dragon.color === "Black";
  if (nat.includes("red d")) return result.dragon.color === "Red";

  if (nat.includes("black t")) return result.tiger.color === "Black";
  if (nat.includes("red t")) return result.tiger.color === "Red";

  if (nat.includes("black l")) return result.lion.color === "Black";
  if (nat.includes("red l")) return result.lion.color === "Red";

  return false;
}

/* ================= ODD / EVEN ================= */

export function isWinningDTL20OddEvenBet(
  bet: { nat: string },
  result: DTL20Result
): boolean {
  const nat = bet.nat.toLowerCase();

  if (nat.includes("odd d")) return !!result.dragon.odd;
  if (nat.includes("even d")) return !!result.dragon.even;

  if (nat.includes("odd t")) return !!result.tiger.odd;
  if (nat.includes("even t")) return !!result.tiger.even;

  if (nat.includes("odd l")) return !!result.lion.odd;
  if (nat.includes("even l")) return !!result.lion.even;

  return false;
}

/* ================= CARD ================= */

export function isWinningDTL20CardBet(
  bet: { nat: string },
  result: DTL20Result
): boolean {
  const nat = bet.nat.toLowerCase();

  if (nat.startsWith("dragon")) {
    const v = nat.replace("dragon", "").trim().toUpperCase();
    return result.dragon.card === v;
  }

  if (nat.startsWith("tiger")) {
    const v = nat.replace("tiger", "").trim().toUpperCase();
    return result.tiger.card === v;
  }

  if (nat.startsWith("lion")) {
    const v = nat.replace("lion", "").trim().toUpperCase();
    return result.lion.card === v;
  }

  return false;
}

/* ================= LAST 10 ================= */

export function formatDTL20Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "D" :
      r.win === "21" ? "T" :
      r.win === "41" ? "L" : "-"
  }));
}
