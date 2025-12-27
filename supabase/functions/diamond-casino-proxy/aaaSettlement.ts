/* =====================================================
   AAA (Amar Akbar Anthony) Settlement
===================================================== */

export interface AAAResult {
  mid?: string | number;
  winnerId: number;      // 1 | 2 | 3
  winnerName: string;    // Amar | Akbar | Anthony
  card: string;          // "2CC"
  rank: number;          // 1–13
  suit: string;          // CC | DD | HH | SS
}

/* ================= TABLE CHECK ================= */

export function isAAATable(tableId: string): boolean {
  return tableId?.toLowerCase() === "aaa";
}

/* ================= CARD PARSE ================= */

function parseCard(card: string) {
  const rankMap: any = {
    A: 1, J: 11, Q: 12, K: 13
  };

  const r = card.slice(0, -2);
  const suit = card.slice(-2);

  const rank = rankMap[r] ?? Number(r);

  return { rank, suit };
}

/* ================= PARSE RESULT ================= */

export function parseAAAResult(
  win: string,
  card: string,
  mid?: string | number
): AAAResult | null {
  if (!win || !card) return null;

  const winnerId = Number(win);
  const winnerName =
    winnerId === 1 ? "Amar" :
    winnerId === 2 ? "Akbar" :
    "Anthony";

  const { rank, suit } = parseCard(card);

  const result: AAAResult = {
    mid,
    winnerId,
    winnerName,
    card,
    rank,
    suit,
  };

  console.log("🎯 [AAA Parsed]", result);
  return result;
}

/* ================= BET CHECK ================= */

export function isWinningAAABet(
  bet: any,
  result: AAAResult
): boolean {

  /* Match */
  if (bet.subtype === "aaa") {
    return bet.sr === result.winnerId;
  }

  /* Even / Odd */
  if (bet.nat === "Even") return result.rank % 2 === 0;
  if (bet.nat === "Odd") return result.rank % 2 === 1;

  /* Color */
  if (bet.nat === "Red") return ["HH", "DD"].includes(result.suit);
  if (bet.nat === "Black") return ["SS", "CC"].includes(result.suit);

  /* Card Match */
  if (bet.nat.startsWith("Card")) {
    const cardRank = bet.nat.split(" ")[1];
    const map: any = { A:1, J:11, Q:12, K:13 };
    const r = map[cardRank] ?? Number(cardRank);
    return result.rank === r;
  }

  /* Under / Over 7 */
  if (bet.nat === "Under 7") return result.rank < 7;
  if (bet.nat === "Over 7") return result.rank > 7;

  return false;
}
