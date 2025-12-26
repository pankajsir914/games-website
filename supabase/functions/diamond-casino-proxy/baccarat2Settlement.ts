/* =====================================================
   BACCARAT 2 Settlement
===================================================== */

/* ================= TYPES ================= */

export interface Baccarat2Result {
  winner: "Player" | "Banker" | "Tie";
  score?: number;            // 1–9
  cards: string[];
  rdesc?: string;
}

/* ================= TABLE CHECK ================= */

export function isBaccarat2Table(tableId: string): boolean {
  if (!tableId) return false;
  const t = tableId.toLowerCase();
  return t === "baccarat2" || t.includes("baccarat2");
}

/* ================= PARSE RESULT ================= */

export function parseBaccarat2Result(
  win: string,
  card: string,
  rdesc?: string
): Baccarat2Result | null {
  if (!win || !rdesc) return null;

  const winnerMap: Record<string, Baccarat2Result["winner"]> = {
    "1": "Player",
    "2": "Banker",
    "3": "Tie",
  };

  const winner = winnerMap[win];
  if (!winner) return null;

  const parts = rdesc.split("#").map(p => p.trim());

  // rdesc example: "Player#-#8"
  const score = Number(parts[2]);

  const result: Baccarat2Result = {
    winner,
    score: isNaN(score) ? undefined : score,
    cards: card ? card.split(",") : [],
    rdesc,
  };

  console.log("🎴 [BACCARAT2 Parsed]", result);
  return result;
}

/* ================= MAIN BET ================= */

export function isWinningBaccarat2MainBet(
  bet: { nat: string },
  result: Baccarat2Result
): boolean {
  return bet.nat.toLowerCase() === result.winner.toLowerCase();
}

/* ================= SCORE BET ================= */

export function isWinningBaccarat2ScoreBet(
  bet: { nat: string },
  result: Baccarat2Result
): boolean {
  if (!result.score) return false;

  const nat = bet.nat.toLowerCase();

  if (nat === "score 1-4") return result.score >= 1 && result.score <= 4;
  if (nat === "score 5-6") return result.score === 5 || result.score === 6;
  if (nat === "score 7") return result.score === 7;
  if (nat === "score 8") return result.score === 8;
  if (nat === "score 9") return result.score === 9;

  return false;
}

/* ================= PAIR BET ================= */
/**
 * NOTE:
 * API does NOT expose pair info for baccarat2.
 * Safe behaviour → always LOSS.
 */
export function isWinningBaccarat2PairBet(): boolean {
  return false;
}

/* ================= LAST 10 FORMAT ================= */

export function formatBaccarat2Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "P" :
      r.win === "2" ? "B" :
      r.win === "3" ? "T" : "-"
  }));
}
