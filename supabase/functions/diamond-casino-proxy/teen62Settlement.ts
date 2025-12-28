/* =====================================================
   TYPES
===================================================== */

export type Teen62Winner = "Player A" | "Player B" | "Tie";

export type Teen62Result = {
  mid?: string | number;
  winner: Teen62Winner;
  winCode: "1" | "2" | "0";
  isTie: boolean;
  rdesc?: string;
  cards?: string[];
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isTeen62Table(tableId?: string): boolean {
  if (!tableId) return false;
  return tableId.toLowerCase() === "teen62";
}

/* =====================================================
   RESULT PARSER (HARDENED)
===================================================== */

export function parseTeen62Result(
  rdesc?: string | null,
  winnat?: string | null,
  win?: string | number | null,
  mid?: string | number,
  card?: string
): Teen62Result | null {

  const winCode = String(win ?? "");

  /* ---------- TIE ---------- */
  if (winCode === "0" || winnat?.toLowerCase() === "tie") {
    return {
      mid,
      winner: "Tie",
      winCode: "0",
      isTie: true,
      rdesc: rdesc || undefined,
      cards: card?.split(","),
    };
  }

  /* ---------- PRIMARY: winnat ---------- */
  if (winnat) {
    const clean = winnat.trim();
    const winner =
      clean === "Player A" ? "Player A" :
      clean === "Player B" ? "Player B" :
      null;

    if (winner) {
      return {
        mid,
        winner,
        winCode: winner === "Player A" ? "1" : "2",
        isTie: false,
        rdesc: rdesc || undefined,
        cards: card?.split(","),
      };
    }
  }

  /* ---------- FALLBACK: rdesc parsing ---------- */
  if (rdesc) {
    if (rdesc.includes("A : Yes")) {
      return {
        mid,
        winner: "Player A",
        winCode: "1",
        isTie: false,
        rdesc,
        cards: card?.split(","),
      };
    }

    if (rdesc.includes("B : Yes")) {
      return {
        mid,
        winner: "Player B",
        winCode: "2",
        isTie: false,
        rdesc,
        cards: card?.split(","),
      };
    }
  }

  return null;
}

/* =====================================================
   MAIN BET SETTLEMENT
===================================================== */

export function isTeen62WinningBet(
  betType: string,
  result: Teen62Result,
  side: "back" | "lay" = "back"
): "WIN" | "LOSS" | "PUSH" {

  if (!betType || !result) return "LOSS";

  /* Tie → PUSH (rules) */
  if (result.isTie) return "PUSH";

  const bet = betType.toLowerCase().trim();
  const winner = result.winner.toLowerCase();

  const isMatch = bet === winner;

  if (side === "back") return isMatch ? "WIN" : "LOSS";
  return isMatch ? "LOSS" : "WIN";
}

/* =====================================================
   SIDE BET HANDLING
   - Odd / Even
   - Suit
   - Consecutive
===================================================== */

export function isTeen62SideBetResult(
  isConditionMet: boolean,
  result: Teen62Result,
  side: "back" | "lay" = "back"
): "WIN" | "LOSS" | "PUSH" {

  if (!result) return "LOSS";

  /* Tie → PUSH */
  if (result.isTie) return "PUSH";

  if (side === "back") return isConditionMet ? "WIN" : "LOSS";
  return isConditionMet ? "LOSS" : "WIN";
}

/* =====================================================
   LAST RESULTS FORMAT (UI SAFE)
===================================================== */

export function formatTeen62LastResults(
  results: Array<{ mid: string | number; win: string | number }>
) {
  return results.map(r => ({
    mid: r.mid,
    code: String(r.win),
    result:
      String(r.win) === "1" ? "A" :
      String(r.win) === "2" ? "B" :
      String(r.win) === "0" ? "T" :
      "?"
  }));
}

/* =====================================================
   UI LABEL
===================================================== */

export function getTeen62ResultLabel(result: Teen62Result): string {
  if (result.isTie) return "Tie";
  return result.winner === "Player A"
    ? "Player A Wins"
    : "Player B Wins";
}
