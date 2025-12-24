// dum10Settlement.ts

/* =====================================================
   TYPES
===================================================== */

export type Dum10MainResult = "YES" | "NO" | "TIE";

export type Dum10Result = {
  main: Dum10MainResult;
  attributes: Set<string>;
};

/* =====================================================
   TABLE CHECK
===================================================== */

export function isDum10Table(tableId: string): boolean {
  return tableId?.toLowerCase() === "dum10";
}

/* =====================================================
   PARSER
===================================================== */

export function parseDum10Result(
  win: string | number,
  rdesc?: string,
  winnat?: string
): Dum10Result {
  const attributes = new Set<string>();

  if (rdesc) {
    rdesc
      .split("#")
      .map(v => v.toLowerCase().trim())
      .forEach(v => attributes.add(v));
  }

  let main: Dum10MainResult = "TIE";

  const v = String(win);

  if (v === "1") main = "YES";
  else if (v === "2") main = "NO";

  // fallback
  if (main === "TIE" && winnat) {
    if (winnat.toLowerCase().includes("no")) main = "NO";
    if (winnat.toLowerCase().includes("yes")) main = "YES";
  }

  console.log("🎯 [DUM10 Parsed]", {
    main,
    attributes: Array.from(attributes)
  });

  return { main, attributes };
}

/* =====================================================
   BET MATCHING
===================================================== */

export function isDum10WinningBet(
  betType: string,
  result: Dum10Result,
  side: "back" | "lay" = "back"
): boolean {
  const bet = betType.toLowerCase().trim();

  let isMatch = false;

  // Main match
  if (bet.includes("10") || bet.includes("total")) {
    if (bet.includes("yes") && result.main === "YES") isMatch = true;
    if (bet.includes("no") && result.main === "NO") isMatch = true;
  }

  // Fancy match
  if (!isMatch && result.attributes.has(bet)) {
    isMatch = true;
  }

  console.log("🔍 [DUM10 Match]", {
    betType,
    main: result.main,
    attributes: Array.from(result.attributes),
    isMatch
  });

  return side === "back" ? isMatch : !isMatch;
}

/* =====================================================
   LAST 10 RESULTS (YES / NO)
===================================================== */

export function formatDum10LastResults(
  results: Array<{ mid: string | number; win: string | number }>
) {
  return results.map(r => {
    let result = "T";

    if (String(r.win) === "1") result = "YES";
    else if (String(r.win) === "2") result = "NO";

    return {
      mid: r.mid,
      result
    };
  });
}
