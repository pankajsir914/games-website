/* =====================================================
   Bollywood Table (btable) Settlement
===================================================== */

export interface BTableResult {
  mid?: string | number;
  winnerId: number;      // 1–6
  winnerName: string;
  card: string;
  rank: number;
  suit: string;
}

/* ================= TABLE CHECK ================= */

export function isBTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "btable";
}

/* ================= CARD PARSE ================= */

function parseCard(card: string) {
  const map: any = { A: 1, J: 11, Q: 12, K: 13 };
  const r = card.slice(0, -2);
  const suit = card.slice(-2);
  const rank = map[r] ?? Number(r);
  return { rank, suit };
}

/* ================= PARSE RESULT ================= */

export function parseBTableResult(
  win: string,
  card: string,
  mid?: string | number
): BTableResult | null {
  if (!win || !card) return null;

  const winnerId = Number(win);

  const winnerMap: any = {
    1: "Don",
    2: "Amar Akbar Anthony",
    3: "Sahib Bibi Aur Ghulam",
    4: "Dharam Veer",
    5: "Kis Kis Ko Pyaar Karoon",
    6: "Ghulam",
  };

  const { rank, suit } = parseCard(card);

  const result: BTableResult = {
    mid,
    winnerId,
    winnerName: winnerMap[winnerId],
    card,
    rank,
    suit,
  };

  console.log("🎬 [BTABLE Parsed]", result);
  return result;
}

/* ================= BET CHECK ================= */

export function isWinningBTableBet(
  bet: any,
  result: BTableResult
): boolean {

  /* Match */
  if (bet.subtype === "btable") {
    return bet.sr === result.winnerId;
  }

  /* Odd */
  if (bet.nat === "Odd") {
    return result.rank % 2 === 1;
  }

  /* Color */
  if (bet.nat === "Red") {
    return ["HH", "DD"].includes(result.suit);
  }
  if (bet.nat === "Black") {
    return ["SS", "CC"].includes(result.suit);
  }

  /* Card Match */
  if (bet.nat.startsWith("Card")) {
    const c = bet.nat.split(" ")[1];
    const map: any = { A:1, J:11, Q:12, K:13 };
    return result.rank === map[c];
  }

  /* Dulha Dulhan (K–Q) */
  if (bet.nat.includes("Dulha")) {
    return result.rank === 12 || result.rank === 13;
  }

  /* Barati (J–A) */
  if (bet.nat.includes("Barati")) {
    return result.rank === 1 || result.rank === 11;
  }

  return false;
}
