/* =====================================================
   TEEN9 (Tiger / Lion / Dragon) Settlement
===================================================== */

/* ================= TYPES ================= */

export interface Teen9Result {
  winnerId: number;                 // 1 | 2 | 3
  winnerName: "Tiger" | "Lion" | "Dragon";
  cards: string[];                  // 9 cards
  handType?:                         // from rdesc
    | "Winner"
    | "Pair"
    | "Flush"
    | "Straight"
    | "Trio"
    | "Straight Flush";
  rdesc?: string;
}

/* ================= TABLE CHECK ================= */

export function isTeen9Table(tableId: string): boolean {
  if (!tableId) return false;
  const t = tableId.toLowerCase();
  return t === "teen9" || t.includes("teen9");
}

/* ================= PARSE RESULT ================= */

export function parseTeen9Result(
  win: string,
  card: string,
  rdesc?: string
): Teen9Result | null {
  if (!win) return null;

  const id = Number(win);

  const winnerMap: Record<number, Teen9Result["winnerName"]> = {
    1: "Tiger",
    2: "Lion",
    3: "Dragon",
  };

  const winnerName = winnerMap[id];
  if (!winnerName) return null;

  let handType: Teen9Result["handType"];

  if (rdesc) {
    const d = rdesc.toLowerCase();
    if (d.includes("straight flush")) handType = "Straight Flush";
    else if (d.includes("trio")) handType = "Trio";
    else if (d.includes("straight")) handType = "Straight";
    else if (d.includes("flush")) handType = "Flush";
    else if (d.includes("pair")) handType = "Pair";
    else handType = "Winner";
  }

  const result: Teen9Result = {
    winnerId: id,
    winnerName,
    cards: card ? card.split(",") : [],
    handType,
    rdesc,
  };

  console.log("🃏 [TEEN9 Parsed]", result);
  return result;
}

/* ================= WINNER BET ================= */

export function isWinningTeen9WinnerBet(
  bet: { nat: string },
  result: Teen9Result
): boolean {
  return bet.nat.toLowerCase() === `${result.winnerName.toLowerCase()} winner`;
}

/* ================= HAND TYPE BET ================= */

export function isWinningTeen9HandBet(
  bet: { nat: string },
  result: Teen9Result
): boolean {
  if (!result.handType) return false;

  const nat = bet.nat.toLowerCase();
  const player = result.winnerName.toLowerCase();
  const hand = result.handType.toLowerCase();

  return nat.includes(player) && nat.includes(hand);
}

/* ================= LAST 10 FORMAT ================= */

export function formatTeen9Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "T" :
      r.win === "2" ? "L" :
      r.win === "3" ? "D" : "-"
  }));
}
