/**
 * Generic Dragon-Tiger (DT202) Settlement Engine
 * Same design philosophy as Lucky5Settlement
 */

/* ======================= TYPES ======================= */

export interface DT202Result {
  winner: 'Dragon' | 'Tiger' | 'Tie';
  dragon: {
    parity?: 'Even' | 'Odd';
    color?: 'Red' | 'Black';
    card?: string;
  };
  tiger: {
    parity?: 'Even' | 'Odd';
    color?: 'Red' | 'Black';
    card?: string;
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

/* ======================= PARSER ======================= */

/**
 * Parse DT202 rdesc
 */
export function parseDT202Result(
  rdesc: string | null | undefined
): DT202Result | null {
  if (!rdesc || typeof rdesc !== 'string') return null;

  const parts = rdesc
    .split('#')
    .map(p => p.trim())
    .filter(Boolean);

  const result: DT202Result = {
    winner: 'Tie',
    dragon: {},
    tiger: {},
    rawParts: parts
  };

  for (const part of parts) {
    const p = normalize(part);

    // Winner
    if (p === 'dragon' || p === 'tiger' || p === 'tie') {
      result.winner = part as any;
      continue;
    }

    // Dragon attributes
    if (p.startsWith('d :')) {
      const value = part.split(':')[1]?.trim();
      if (!value) continue;

      if (value === 'Even' || value === 'Odd') result.dragon.parity = value;
      else if (value === 'Red' || value === 'Black') result.dragon.color = value;
      else result.dragon.card = value;
    }

    // Tiger attributes
    if (p.startsWith('t :')) {
      const value = part.split(':')[1]?.trim();
      if (!value) continue;

      if (value === 'Even' || value === 'Odd') result.tiger.parity = value;
      else if (value === 'Red' || value === 'Black') result.tiger.color = value;
      else result.tiger.card = value;
    }
  }

  console.log("🎯 [DT202 Parsed Result]", result);
  return result;
}

/* ======================= MATCH ENGINE ======================= */

export function isDT202WinningBet(
  betCoverage: string,
  result: DT202Result,
  betSide: 'back' | 'lay' = 'back'
): boolean {
  const normalizedBet = normalize(betCoverage);
  let match = false;

  console.log("🔍 [DT202 Match]", { betCoverage, result });

  /* ---------- MAIN RESULT ---------- */
  if (normalizedBet === normalize(result.winner)) {
    match = true;
  }

  /* ---------- PAIR ---------- */
  if (normalizedBet === 'pair') {
    match =
      result.dragon.card &&
      result.tiger.card &&
      normalize(result.dragon.card) === normalize(result.tiger.card);
  }

  /* ---------- DRAGON / TIGER ATTRIBUTES ---------- */
  if (normalizedBet.startsWith('dragon')) {
    const suffix = normalizedBet.replace('dragon', '').trim();

    if (suffix === normalize(result.dragon.parity || '')) match = true;
    if (suffix === normalize(result.dragon.color || '')) match = true;
    if (suffix.startsWith('card')) {
      const card = suffix.replace('card', '').trim();
      if (normalize(card) === normalize(result.dragon.card || '')) match = true;
    }
  }

  if (normalizedBet.startsWith('tiger')) {
    const suffix = normalizedBet.replace('tiger', '').trim();

    if (suffix === normalize(result.tiger.parity || '')) match = true;
    if (suffix === normalize(result.tiger.color || '')) match = true;
    if (suffix.startsWith('card')) {
      const card = suffix.replace('card', '').trim();
      if (normalize(card) === normalize(result.tiger.card || '')) match = true;
    }
  }

  return betSide === 'back' ? match : !match;
}

/* ======================= SETTLEMENT ======================= */

export function settleDT202Bets(
  rdesc: string | null | undefined,
  bets: UserBet[]
): Array<{
  bet: UserBet;
  isWin: boolean;
  payout?: number;
  reason: string;
}> {
  const parsed = parseDT202Result(rdesc);

  if (!parsed) {
    return bets.map(bet => ({
      bet,
      isWin: false,
      reason: 'Invalid rdesc'
    }));
  }

  return bets.map(bet => {
    const side = bet.side || 'back';

    const isWin = isDT202WinningBet(
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
        ? `Matched "${bet.bet_type}" with DT202 result`
        : `No match for "${bet.bet_type}"`
    };
  });
}
