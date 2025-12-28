/* =====================================================
   TYPES
===================================================== */

export type Teen62Winner = "Player A" | "Player B" | "Tie";

export type Teen62Result = {
  mid?: string | number;
  winner: Teen62Winner;
  winCode: "1" | "2" | "0"; // 1=A, 2=B, 0=Tie
  isTie: boolean;
  rdesc?: string;
  cards?: string[];
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isTeen62Table(tableId?: string): boolean {
  if (!tableId) return false;
  const t = tableId.toLowerCase();
  return t === "teen62";
}

/* =====================================================
   RESULT PARSER
===================================================== */

export function parseTeen62Result(
  rdesc: string | null,
  winnat: string | null,
  win: string | null,
  mid?: string | number,
  card?: string
): Teen62Result | null {
  // ---- TIE (rules mention push on tie)
  if (win === "0") {
    return {
      mid,
      winner: "Tie",
      winCode: "0",
      isTie: true,
      rdesc: rdesc || undefined,
      cards: card ? card.split(",") : undefined,
    };
  }

  // ---- Prefer winnat
  if (winnat) {
    const clean = winnat.trim();
    return {
      mid,
      winner: clean === "Player A" ? "Player A" : "Player B",
      winCode: win === "1" ? "1" : "2",
      isTie: false,
      rdesc: rdesc || undefined,
      cards: card ? card.split(",") : undefined,
    };
  }

  // ---- Fallback: parse rdesc
  if (!rdesc) return null;

  const first = rdesc.split("#")[0]?.trim();
  if (!first) return null;

  return {
    mid,
    winner: first === "Player A" ? "Player A" : "Player B",
    winCode: win === "1" ? "1" : "2",
    isTie: false,
    rdesc,
    cards: card ? card.split(",") : undefined,
  };
}

/* =====================================================
   BET MATCHING (MAIN BET)
===================================================== */

export function isTeen62WinningBet(
  betType: string,
  result: Teen62Result,
  side: "back" | "lay" = "back"
): "WIN" | "LOSS" | "PUSH" {
  if (!betType || !result) return "LOSS";

  // ---- Tie = PUSH (rules)
  if (result.isTie) return "PUSH";

  const bet = betType.toLowerCase().trim();
  const winner = result.winner.toLowerCase();

  const isMatch = bet === winner;

  if (side === "back") return isMatch ? "WIN" : "LOSS";
  return isMatch ? "LOSS" : "WIN";
}

/* =====================================================
   SIDE BET HANDLING (SAFE DEFAULT)
   - Odd/Even
   - Suit
   - Consecutive
   NOTE: On Tie → PUSH
===================================================== */

export function isTeen62SideBetResult(
  isConditionMet: boolean,
  result: Teen62Result,
  side: "back" | "lay" = "back"
): "WIN" | "LOSS" | "PUSH" {
  if (result.isTie) return "PUSH";

  if (side === "back") return isConditionMet ? "WIN" : "LOSS";
  return isConditionMet ? "LOSS" : "WIN";
}

/* =====================================================
   LAST 10 RESULTS FORMAT (FRONTEND)
===================================================== */

export function formatTeen62LastResults(
  results: Array<{ mid: string | number; win: string }>
) {
  return results.map(r => ({
    mid: r.mid,
    code: r.win,
    result:
      r.win === "1" ? "A" :
      r.win === "2" ? "B" :
      r.win === "0" ? "T" :
      "?"
  }));
}

/* =====================================================
   UI FRIENDLY LABEL
===================================================== */

export function getTeen62ResultLabel(result: Teen62Result): string {
  if (result.isTie) return "Tie";
  return result.winner === "Player A" ? "Player A Wins" : "Player B Wins";
}
