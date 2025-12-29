/* =====================================================
   BACCARAT Settlement (FINAL – FULLY SAFE)
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

  /**
   * Expected rdesc format:
   * [0] Player/Banker/Tie
   * [2] Player Pair (Yes/No)
   * [3] Banker Pair (Yes/No)
   * [4] Big/Small
   */

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

  console.log("🎴 [BACCARAT Parsed Result]", result);
  return result;
}

/* =====================================================
   MASTER WIN / LOSS ENGINE (ALL CONDITIONS)
===================================================== */

export function isWinningBaccaratBet(
  bet: { nat: string },
  result: BaccaratResult
): boolean {

  if (!bet?.nat || !result) return false;

  const nat = bet.nat.toLowerCase().trim();

  /* ================= MAIN BETS ================= */

  if (nat === "player") return result.winner === "Player";
  if (nat === "banker") return result.winner === "Banker";
  if (nat === "tie") return result.winner === "Tie";

  /**
   * IMPORTANT:
   * If result is Tie:
   * - Player bet → LOSS
   * - Banker bet → LOSS
   * (handled automatically above)
   */

  /* ================= PAIR BETS ================= */

  if (nat === "player pair") return result.playerPair;
  if (nat === "banker pair") return result.bankerPair;
  if (nat === "either pair")
    return result.playerPair || result.bankerPair;

  /* ================= PERFECT PAIR ================= */

  /**
   * API does NOT provide perfect pair data.
   * Safe casino behaviour → ALWAYS LOSS
   */
  if (nat === "perfect pair") return false;

  /* ================= BIG / SMALL ================= */

  if (nat === "big") return result.big;
  if (nat === "small") return result.small;

  /* ================= UNKNOWN BET ================= */

  console.warn("⚠️ Unknown Baccarat bet type:", bet.nat);
  return false;
}

/* =====================================================
   LAST 10 RESULT FORMAT
===================================================== */

export function formatBaccaratLast10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "P" :
      r.win === "2" ? "B" :
      r.win === "3" ? "T" : "-"
  }));
}
