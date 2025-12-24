/**
 * DT6 (1 Day Dragon Tiger) Settlement Engine
 * Same architecture as Lucky5 & DT202
 */

/* ======================= TYPES ======================= */

export interface DT6Result {
  winner: 'Dragon' | 'Tiger' | 'Tie';
  dragon: {
    parity?: 'Even' | 'Odd';
    color?: 'Red' | 'Black';
    suit?: 'Spade' | 'Heart' | 'Diamond' | 'Club';
  };
  tiger: {
    parity?: 'Even' | 'Odd';
    color?: 'Red' | 'Black';
    suit?: 'Spade' | 'Heart' | 'Diamond' | 'Club';
  };
  rawParts: string[];
}

export interface UserBet {
  id: string;
  bet_type: string; // nat
  bet_amount: number;
  odds?: number;
  side?: 'back' | 'lay';
}

/* ======================= HELPERS ======================= */

function normalize(v: string): string {
  return v.toLowerCase().trim().replace(/\s+/g, ' ');
}

/* ======================= TABLE DETECTION ======================= */

/**
 * Check if table is DT6
 */
export function isDT6Table(tableId: string): boolean {
  if (!tableId || typeof tableId !== 'string') {
    return false;
  }
  
  const lowerTableId = tableId.toLowerCase().trim();
  return lowerTableId === 'dt6' || lowerTableId.includes('dt6');
}

/* ======================= PARSER ======================= */

/**
 * Parse DT6 rdesc
 */
export function parseDT6Result(
  rdesc: string | null | undefined
): DT6Result | null {
  if (!rdesc || typeof rdesc !== 'string') return null;

  const parts = rdesc
    .split('#')
    .map(p => p.trim())
    .filter(Boolean);

  const result: DT6Result = {
    winner: 'Tie',
    dragon: {},
    tiger: {},
    rawParts: parts
  };

  for (const part of parts) {
    const p = normalize(part);

    /* ---- Winner ---- */
    if (p === 'dragon' || p === 'tiger' || p === 'tie') {
      result.winner = part as any;
      continue;
    }

    /* ---- Dragon attributes ---- */
    if (p.startsWith('d :')) {
      const value = part.split(':')[1]?.trim();
      if (!value) continue;

      if (value === 'Even' || value === 'Odd') result.dragon.parity = value;
      else if (value === 'Red' || value === 'Black') result.dragon.color = value;
      else result.dragon.suit = value as any;
    }

    /* ---- Tiger attributes ---- */
    if (p.startsWith('t :')) {
      const value = part.split(':')[1]?.trim();
      if (!value) continue;

      if (value === 'Even' || value === 'Odd') result.tiger.parity = value;
      else if (value === 'Red' || value === 'Black') result.tiger.color = value;
      else result.tiger.suit = value as any;
    }
  }

  console.log("🎯 [DT6 Parsed Result]", result);
  return result;
}

/* ======================= MATCH ENGINE ======================= */

export function isDT6WinningBet(
  betCoverage: string,
  result: DT6Result,
  betSide: 'back' | 'lay' = 'back'
): boolean {
  const normalizedBet = normalize(betCoverage);
  let match = false;

  console.log("🔍 [DT6 Match]", { betCoverage, result });

  /* ---------- Main winner ---------- */
  if (normalizedBet === normalize(result.winner)) {
    match = true;
  }

  /* ---------- Pair ---------- */
  if (normalizedBet === 'pair') {
    // Pair only when both suits same
    match = !!(
      result.dragon.suit &&
      result.tiger.suit &&
      normalize(result.dragon.suit) === normalize(result.tiger.suit)
    );
  }

  /* ---------- Dragon bets ---------- */
  if (normalizedBet.startsWith('dragon')) {
    const suffix = normalizedBet.replace('dragon', '').trim();

    if (result.dragon.parity && suffix === normalize(result.dragon.parity)) match = true;
    if (result.dragon.color && suffix === normalize(result.dragon.color)) match = true;
    if (result.dragon.suit && suffix === normalize(result.dragon.suit)) match = true;
  }

  /* ---------- Tiger bets ---------- */
  if (normalizedBet.startsWith('tiger')) {
    const suffix = normalizedBet.replace('tiger', '').trim();

    if (result.tiger.parity && suffix === normalize(result.tiger.parity)) match = true;
    if (result.tiger.color && suffix === normalize(result.tiger.color)) match = true;
    if (result.tiger.suit && suffix === normalize(result.tiger.suit)) match = true;
  }

  return betSide === 'back' ? match : !match;
}

/* ======================= SETTLEMENT ======================= */

export function settleDT6Bets(
  rdesc: string | null | undefined,
  bets: UserBet[]
): Array<{
  bet: UserBet;
  isWin: boolean;
  payout?: number;
  reason: string;
}> {
  const parsed = parseDT6Result(rdesc);

  if (!parsed) {
    return bets.map(bet => ({
      bet,
      isWin: false,
      reason: 'Invalid rdesc'
    }));
  }

  return bets.map(bet => {
    const side = bet.side || 'back';

    const isWin = isDT6WinningBet(
      bet.bet_type,
      parsed,
      side
    );

    const payout =
      isWin && bet.odds
        ? Number((bet.bet_amount * bet.odds).toFixed(2))
        : undefined;

    return {
      bet,
      isWin,
      payout,
      reason: isWin
        ? `Matched "${bet.bet_type}" with DT6 result`
        : `No match for "${bet.bet_type}"`
    };
  });
}
