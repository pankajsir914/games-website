/* =====================================================
   3 Cards Judgement (3cardj) Settlement
===================================================== */

export interface ThreeCardJResult {
  cards: string[];        // ["Q", "10", "K"]
  rawCards: string[];     // ["QSS","10SS","KHH"]
  rdesc?: string;
  mid?: string | number;
}

/* ================= TABLE CHECK ================= */

export function is3CardJTable(tableId: string): boolean {
  return tableId?.toLowerCase() === "3cardj";
}

/* ================= PARSE RESULT ================= */

export function parse3CardJResult(
  win: string,
  card: string,
  rdesc?: string,
  mid?: string | number
): ThreeCardJResult | null {
  if (!win || !card) return null;

  const rawCards = card.split(",");

  const cards = rawCards.map(c =>
    c.replace(/[SHDC]/g, "") // remove suit
  );

  const result: ThreeCardJResult = {
    cards,
    rawCards,
    rdesc,
    mid,
  };

  console.log("🃏 [3CARDJ Parsed]", result);
  return result;
}

/* ================= MATCH COUNT ================= */

export function countMatchedCards(
  selectedCards: string[],
  result: ThreeCardJResult
): number {
  return selectedCards.filter(c =>
    result.cards.includes(c)
  ).length;
}

/* ================= YES / NO ================= */

export function isWinning3CardJBet(
  bet: { nat: string; selectedCards?: string[] },
  result: ThreeCardJResult
): boolean {
  if (!bet.selectedCards || bet.selectedCards.length !== 3) {
    return false;
  }

  const matchCount = countMatchedCards(
    bet.selectedCards,
    result
  );

  if (bet.nat === "Yes") {
    return matchCount >= 1;
  }

  if (bet.nat === "No") {
    return matchCount === 0;
  }

  return false;
}

/* ================= LAST 10 FORMAT ================= */

export function format3CardJLast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result: r.win, // e.g. Q10K
  }));
}
