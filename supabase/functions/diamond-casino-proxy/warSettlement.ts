/* =====================================================
   Casino War Settlement
===================================================== */

export interface WarResult {
  mid?: string | number;
  winners: number[];     // [1,2,3]
  seatCards: Record<number, string>; // seat -> card
}

/* ================= TABLE CHECK ================= */

export function isWarTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "war";
}

/* ================= CARD HELPERS ================= */

const suitMap: Record<string, string> = {
  SS: "spade",
  HH: "heart",
  DD: "diamond",
  CC: "club",
};

function getCardValue(card: string): number {
  const v = card.replace(/[SHDC]/g, "");

  if (v === "A") return 1;
  if (v === "J") return 11;
  if (v === "Q") return 12;
  if (v === "K") return 13;

  return Number(v);
}

function getCardColor(card: string): "red" | "black" {
  return card.includes("H") || card.includes("D")
    ? "red"
    : "black";
}

function getCardSuit(card: string): string {
  return suitMap[card.slice(-2)] || "";
}

/* ================= PARSE RESULT ================= */

export function parseWarResult(
  win: string,
  card: string,
  mid?: string | number
): WarResult {
  const winners =
    win === "0"
      ? []
      : win.split(",").map(n => Number(n));

  const cards = card.split(",");

  const seatCards: Record<number, string> = {};
  for (let i = 1; i <= 6; i++) {
    seatCards[i] = cards[i];
  }

  const result: WarResult = {
    mid,
    winners,
    seatCards,
  };

  console.log("⚔️ [WAR Parsed]", result);
  return result;
}

/* ================= BET CHECK ================= */

export function isWinningWarBet(
  bet: { nat: string },
  result: WarResult
): boolean {
  const parts = bet.nat.split(" ");
  const type = parts[0];
  const seat = Number(parts[1]);

  const card = result.seatCards[seat];
  if (!card) return false;

  switch (type.toLowerCase()) {
    case "winner":
      return result.winners.includes(seat);

    case "black":
      return getCardColor(card) === "black";

    case "red":
      return getCardColor(card) === "red";

    case "odd":
      return getCardValue(card) % 2 === 1;

    case "even":
      return getCardValue(card) % 2 === 0;

    case "spade":
    case "heart":
    case "club":
    case "diamond":
      return getCardSuit(card) === type.toLowerCase();

    default:
      return false;
  }
}

/* ================= LAST 10 FORMAT ================= */

export function formatWarLast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    win: r.win,
  }));
}
