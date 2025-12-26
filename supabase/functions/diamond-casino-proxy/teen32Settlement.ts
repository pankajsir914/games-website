/* =====================================================
   TEEN32 – INSTANT TEENPATTI 2.0
===================================================== */

export interface Teen32Result {
  winnerId: 1 | 2;
  winnerName: "Player A" | "Player B";
}

/* ================= TABLE CHECK ================= */

export function isTeen32Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "teen32";
}

/* ================= PARSE RESULT ================= */

export function parseTeen32Result(win: string): Teen32Result | null {
  if (win !== "1" && win !== "2") return null;

  return {
    winnerId: win === "1" ? 1 : 2,
    winnerName: win === "1" ? "Player A" : "Player B",
  };
}

/* ================= BET MATCH ================= */

export function isTeen32WinningBet(
  bet: { nat: string },
  result: Teen32Result
): boolean {
  return bet.nat.trim().toLowerCase() ===
         result.winnerName.toLowerCase();
}
