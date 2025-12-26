/* =====================================================
   POKER20 (20-20 Poker) Settlement
===================================================== */

/* ================= TYPES ================= */

export interface Poker20Result {
  winnerId: number;                // 1 | 2
  winnerName: "Player A" | "Player B";
  cards: string[];                 // 9 cards
  playerHands: {
    A?: Poker20Hand;
    B?: Poker20Hand;
  };
  rdesc?: string;
}

export type Poker20Hand =
  | "Winner"
  | "One Pair"
  | "Two Pair"
  | "Three of a Kind"
  | "Straight"
  | "Flush"
  | "Full House"
  | "Four of a Kind"
  | "Straight Flush";

/* ================= TABLE CHECK ================= */

export function isPoker20Table(tableId: string): boolean {
  if (!tableId) return false;
  const t = tableId.toLowerCase();
  return t === "poker20" || t.includes("poker20");
}

/* ================= PARSE RESULT ================= */

export function parsePoker20Result(
  win: string,
  card: string,
  rdesc?: string
): Poker20Result | null {
  if (!win) return null;

  const winnerId = Number(win);
  const winnerName =
    winnerId === 1 ? "Player A" :
    winnerId === 2 ? "Player B" :
    null;

  if (!winnerName) return null;

  const playerHands: Poker20Result["playerHands"] = {};

  if (rdesc) {
    // Example:
    // "Player B#A : Three of a Kind  |  B : Full House"
    const handPart = rdesc.split("#")[1];
    if (handPart) {
      const aMatch = handPart.match(/A\s*:\s*([A-Za-z ]+)/i);
      const bMatch = handPart.match(/B\s*:\s*([A-Za-z ]+)/i);

      if (aMatch) {
        playerHands.A = aMatch[1].trim() as Poker20Hand;
      }
      if (bMatch) {
        playerHands.B = bMatch[1].trim() as Poker20Hand;
      }
    }
  }

  const result: Poker20Result = {
    winnerId,
    winnerName,
    cards: card ? card.split(",") : [],
    playerHands,
    rdesc,
  };

  console.log("🂡 [POKER20 Parsed]", result);
  return result;
}

/* ================= MAIN WINNER BET ================= */

export function isWinningPoker20WinnerBet(
  bet: { nat: string; sr?: number },
  result: Poker20Result
): boolean {
  // Two "Winner" markets exist (sr 1 = A, sr 2 = B)
  const nat = bet.nat.toLowerCase();
  return nat === "winner" && (
    (result.winnerId === 1 && bet.sr === 1) ||
    (result.winnerId === 2 && bet.sr === 2)
  );
}

/* ================= HAND TYPE BET ================= */

export function isWinningPoker20HandBet(
  bet: { nat: string; sr?: number },
  result: Poker20Result
): boolean {
  const nat = bet.nat.toLowerCase();

  const isPlayerA = bet.sr && bet.sr % 2 === 1; // odd SR → A
  const isPlayerB = bet.sr && bet.sr % 2 === 0; // even SR → B

  const handA = result.playerHands.A?.toLowerCase();
  const handB = result.playerHands.B?.toLowerCase();

  if (isPlayerA && handA && nat === handA.toLowerCase()) return true;
  if (isPlayerB && handB && nat === handB.toLowerCase()) return true;

  return false;
}

/* ================= LAST 10 FORMAT ================= */

export function formatPoker20Last10(res: any[]) {
  return res.map(r => ({
    mid: r.mid,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" : "-"
  }));
}
