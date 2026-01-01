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

  playerA?: string[];
  playerB?: string[];
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isTeen62Table(tableId?: string): boolean {
  return !!tableId && tableId.toLowerCase() === "teen62";
}

/* =====================================================
   RESULT PARSER (RULE SAFE)
===================================================== */

export function parseTeen62Result(
  rdesc?: string | null,
  winnat?: string | null,
  win?: string | number | null,
  mid?: string | number,
  card?: string
): Teen62Result | null {

  const winCode = String(win ?? "");
  const cards = card ? card.split(",") : [];

  const playerA = cards.slice(0, 3);
  const playerB = cards.slice(3, 6);

  /* ---------- TIE ---------- */
  if (winCode === "0" || winnat?.toLowerCase() === "tie") {
    return {
      mid,
      winner: "Tie",
      winCode: "0",
      isTie: true,
      rdesc: rdesc || undefined,
      cards,
      playerA,
      playerB,
    };
  }

  /* ---------- PRIMARY: winnat ---------- */
  if (winnat) {
    if (winnat === "Player A" || winnat === "Player B") {
      return {
        mid,
        winner: winnat,
        winCode: winnat === "Player A" ? "1" : "2",
        isTie: false,
        rdesc: rdesc || undefined,
        cards,
        playerA,
        playerB,
      };
    }
  }

  /* ---------- SECONDARY: win code ---------- */
  if (winCode === "1" || winCode === "2") {
    return {
      mid,
      winner: winCode === "1" ? "Player A" : "Player B",
      winCode: winCode as "1" | "2",
      isTie: false,
      rdesc: rdesc || undefined,
      cards,
      playerA,
      playerB,
    };
  }

  /* ---------- FALLBACK: rdesc ---------- */
  if (rdesc) {
    if (rdesc.includes("A : Yes")) {
      return {
        mid,
        winner: "Player A",
        winCode: "1",
        isTie: false,
        rdesc,
        cards,
        playerA,
        playerB,
      };
    }
    if (rdesc.includes("B : Yes")) {
      return {
        mid,
        winner: "Player B",
        winCode: "2",
        isTie: false,
        rdesc,
        cards,
        playerA,
        playerB,
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

  /* Tie → PUSH */
  if (result.isTie) return "PUSH";

  const bet = betType.toLowerCase().trim();
  const winner = result.winner.toLowerCase();

  const isMatch = bet === winner;

  return side === "back"
    ? isMatch ? "WIN" : "LOSS"
    : isMatch ? "LOSS" : "WIN";
}

/* =====================================================
   SIDE BET HANDLING
===================================================== */

export function isTeen62SideBetResult(
  conditionMet: boolean,
  result: Teen62Result,
  side: "back" | "lay" = "back"
): "WIN" | "LOSS" | "PUSH" {

  if (!result) return "LOSS";

  /* Tie → PUSH */
  if (result.isTie) return "PUSH";

  return side === "back"
    ? conditionMet ? "WIN" : "LOSS"
    : conditionMet ? "LOSS" : "WIN";
}

/* =====================================================
   LAST RESULTS (UI SAFE)
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
