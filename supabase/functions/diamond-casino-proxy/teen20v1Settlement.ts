// teen20v1Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export interface Teen20V1Result {
  winner?: "A" | "B";
  baccarat?: "A" | "B";
  total?: "A" | "B";
  colorA?: "red" | "black";
  colorB?: "red" | "black";
  isPairA?: boolean;
  isPairB?: boolean;
}

/* =====================================================
   TABLE CHECK
===================================================== */

export function isTeen20V1Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "teen20v1";
}

/* =====================================================
   PARSER
===================================================== */

export function parseTeen20V1Result(
  rdesc?: string,
  cards?: string
): Teen20V1Result {
  if (!rdesc) return {};

  const parts = rdesc.split("#").map(p => p.trim());

  const result: Teen20V1Result = {};

  // Player winner
  if (parts[0]?.includes("Player A")) result.winner = "A";
  if (parts[0]?.includes("Player B")) result.winner = "B";

  // Baccarat
  if (parts[1]?.includes("Player A")) result.baccarat = "A";
  if (parts[1]?.includes("Player B")) result.baccarat = "B";

  // Total
  if (parts[2]?.includes("Player A")) result.total = "A";
  if (parts[2]?.includes("Player B")) result.total = "B";

  // Colors
  if (parts[4]) {
    const colorPart = parts[4].toLowerCase();

    if (colorPart.includes("a : red")) result.colorA = "red";
    if (colorPart.includes("a : black")) result.colorA = "black";

    if (colorPart.includes("b : red")) result.colorB = "red";
    if (colorPart.includes("b : black")) result.colorB = "black";
  }

  // Pair detection
  if (cards) {
    const cardArr = cards.split(",");
    const aCards = cardArr.slice(0, 3).map(c => c[0]);
    const bCards = cardArr.slice(3).map(c => c[0]);

    result.isPairA = new Set(aCards).size < aCards.length;
    result.isPairB = new Set(bCards).size < bCards.length;
  }

  console.log("🎯 [Teen20V1 Parsed]", result);
  return result;
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isTeen20V1WinningBet(
  betNat: string,
  result: Teen20V1Result,
  side: "back" | "lay" = "back"
): boolean {
  const bet = betNat.toLowerCase();
  let win = false;

  if (bet === "player a" && result.winner === "A") win = true;
  if (bet === "player b" && result.winner === "B") win = true;

  if (bet === "pair plus a" && result.isPairA) win = true;
  if (bet === "pair plus b" && result.isPairB) win = true;

  if (bet === "3 baccarat a" && result.baccarat === "A") win = true;
  if (bet === "3 baccarat b" && result.baccarat === "B") win = true;

  if (bet === "red a" && result.colorA === "red") win = true;
  if (bet === "black a" && result.colorA === "black") win = true;
  if (bet === "red b" && result.colorB === "red") win = true;
  if (bet === "black b" && result.colorB === "black") win = true;

  if (bet === "total a" && result.total === "A") win = true;
  if (bet === "total b" && result.total === "B") win = true;

  console.log("🔍 [Teen20V1 Match]", { betNat, win, result });
  return side === "back" ? win : !win;
}

/* =====================================================
   LAST 10 FORMAT
===================================================== */

export function formatTeen20V1Results(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result: r.win === "1" ? "A" : "B"
  }));
}
