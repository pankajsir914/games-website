// mogamboSettlement.ts

/* =====================================================
   TYPES
===================================================== */

export type MogamboResult = {
    winner: string;     // "Mogambo" | "Daga / Teja"
    winCode: string;    // "1" | "2"
  };
  
  /* =====================================================
     TABLE CHECK
  ===================================================== */
  
  export function isMogamboTable(tableId: string): boolean {
    if (!tableId) return false;
    const t = tableId.toLowerCase().trim();
    return t === "mogambo";
  }
  
  /* =====================================================
     RESULT PARSER
  ===================================================== */
  
  /**
   * rdesc example: "Daga/Teja#21"
   */
  export function parseMogamboResult(
    rdesc: string | null,
    winnat: string | null,
    win: string | null
  ): MogamboResult | null {
  
    if (winnat) {
      return {
        winner: normalizeWinner(winnat),
        winCode: win || ""
      };
    }
  
    if (!rdesc) return null;
  
    const first = rdesc.split("#")[0]?.trim();
    if (!first) return null;
  
    return {
      winner: normalizeWinner(first),
      winCode: win || ""
    };
  }
  
  /* =====================================================
     BET MATCHING
  ===================================================== */
  
  export function isMogamboWinningBet(
    betType: string,
    result: MogamboResult,
    side: "back" | "lay" = "back"
  ): boolean {
    if (!betType) return false;
  
    const bet = normalizeWinner(betType);
    const winner = normalizeWinner(result.winner);
  
    const isMatch = bet === winner;
  
    // BACK = match wins
    if (side === "back") return isMatch;
  
    // LAY = non-match wins
    return !isMatch;
  }
  
  /* =====================================================
     LAST 10 RESULTS FORMAT
  ===================================================== */
  
  export function formatMogamboLastResults(
    results: Array<{ mid: string | number; win: string }>
  ) {
    return results.map(r => ({
      mid: r.mid,
      result:
        r.win === "1" ? "M" :
        r.win === "2" ? "D" :
        "?"
    }));
  }
  
  /* =====================================================
     HELPERS
  ===================================================== */
  
  function normalizeWinner(v: string): string {
    return v
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace("/", "");
  }
