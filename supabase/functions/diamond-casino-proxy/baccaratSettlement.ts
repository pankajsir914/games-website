/* =====================================================
   BACCARAT Settlement
===================================================== */

/* ================= TYPES ================= */

export interface BaccaratResult {
  winner: "Player" | "Banker" | "Tie";
  playerPair: boolean;
  bankerPair: boolean;
  big: boolean;
  small: boolean;
  cards: string[];
  rdesc?: string;
}

/* ================= TABLE CHECK ================= */

export function isBaccaratTable(tableId: string): boolean {
  if (!tableId) return false;
  const t = tableId.toLowerCase();
  return t === "baccarat" || t.includes("baccarat");
}

/* ================= PARSE RESULT ================= */

export function parseBaccaratResult(
  win: string,
  card: string,
  rdesc?: string
): BaccaratResult | null {
  if (!win || !rdesc) return null;

  const winnerMap: Record<string, BaccaratResult["winner"]> = {
    "1": "Player",
    "2": "Banker",
    "3": "Tie",
  };

  const winner = winnerMap[win];
  if (!winner) return null;

  const parts = rdesc.split("#").map(p => p.trim());

  // Expected:
  // [0]=Player/Banker/Tie
  // [2]=Player Pair (Yes/No)
  // [3]=Banker Pair (Yes/No)
  // [4]=Big/Small

  const playerPair = parts[2]?.toLowerCase() === "yes";
  const bankerPair = parts[3]?.toLowerCase() === "yes";

  const big = parts[4]?.toLowerCase() === "big";
  const small = parts[4]?.toLowerCase() === "small";

  const result: BaccaratResult = {
    winner,
    playerPair,
    bankerPair,
    big,
    small,
    cards: card ? card.split(",") : [],
    rdesc,
  };

  console.log("🎴 [BACCARAT Parsed]", result);
  return result;
}

/* ================= MAIN BET ================= */

export function isWinningBaccaratMainBet(
  bet: { nat: string },
  result: BaccaratResult
): boolean {
  return bet.nat.toLowerCase() === result.winner.toLowerCase();
}

/* ================= PAIR BETS ================= */

export function isWinningBaccaratPairBet(
  bet: { nat: string },
  result: BaccaratResult
): boolean {
  const nat = bet.nat.toLowerCase();

  if (nat === "player pair") return result.playerPair;
  if (nat === "banker pair") return result.bankerPair;
  if (nat === "either pair") return result.playerPair || result.bankerPair;

  return false;
}

/* ================= PERFECT PAIR ================= */
/**
 * NOTE:
 * API does NOT expose perfect pair info.
 * Safe behaviour → always LOSS.
 */
export function isWinningBaccaratPerfectPairBet(): boolean {
  return false;
}

/* ================= BIG / SMALL ================= */

export function isWinningBaccaratBigSmallBet(
  bet: { nat: string },
  result: BaccaratResult
): boolean {
  const nat = bet.nat.toLowerCase();
  if (nat === "big") return result.big;
  if (nat === "small") return result.small;
  return false;
}

/* ================= LAST 10 FORMAT ================= */

export function formatBaccaratLast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "P" :
      r.win === "2" ? "B" :
      r.win === "3" ? "T" : "-"
  }));
}
