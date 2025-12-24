/**
 * Generic Roulette Betting Settlement Engine
 * 
 * Design Principles:
 * 1. Data-driven matching (no hardcoded conditions)
 * 2. Single source of truth: winning number (0-36)
 * 3. Derive all attributes from number
 * 4. Generic matching rules
 * 5. Scalable for 100+ bet types
 */

export interface RouletteResult {
  number: number;           // 0-36
  color: 'Red' | 'Black' | 'Green';
  parity: 'Odd' | 'Even' | 'Zero';
  range: '1 to 18' | '19 to 36' | 'Zero';
  dozen: '1st 12' | '2nd 12' | '3rd 12' | 'Zero';
  column: '1st Column' | '2nd Column' | '3rd Column' | 'Zero';
  row?: string;             // For street bets
}

export interface BetDefinition {
  n: string;                // Bet coverage: "17", "Red", "Odd", "1 to 18", "16,17", etc.
  odds?: number;
  label?: string;
  [key: string]: any;       // Allow additional fields
}

export interface UserBet {
  id: string;
  bet_type: string;         // References bet definition's `n` field
  bet_amount: number;
  odds?: number;
  side?: 'back' | 'lay';
  [key: string]: any;
}

/**
 * European Roulette number layout
 * Red: 1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
 * Black: 2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35
 * Green: 0
 */
const ROULETTE_LAYOUT = {
  red: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
  black: [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35],
  green: [0]
};

/**
 * Parse rdesc to extract winning number
 * Handles formats: "17", "17#17", "Winner#17", "02", "2", etc.
 */
export function parseRouletteResult(rdesc: string | null | undefined): number | null {
  if (!rdesc || typeof rdesc !== 'string') {
    return null;
  }

  const trimmed = rdesc.trim();
  if (!trimmed) return null;

  // Split by '#' and take first part (winner)
  const parts = trimmed.split('#').map(p => p.trim()).filter(Boolean);
  const winnerPart = parts[0] || trimmed;

  // Extract number from winner part
  // Handle formats: "17", "17 : Red", "Winner 17", "02", "2", etc.
  // Try to find 1-2 digit number (0-36)
  const numberMatch = winnerPart.match(/\b(\d{1,2})\b/);
  if (numberMatch) {
    const num = parseInt(numberMatch[1], 10);
    if (num >= 0 && num <= 36) {
      return num;
    }
  }

  // If no number found in pattern, try parsing entire string as number
  // This handles cases where rdesc is just "17" or "02"
  const directNum = parseInt(winnerPart, 10);
  if (!isNaN(directNum) && directNum >= 0 && directNum <= 36) {
    return directNum;
  }

  // Also check if there's a number in subsequent parts (after #)
  // Example: "Winner#17" - check parts[1] if parts[0] has no number
  if (parts.length > 1) {
    for (let i = 1; i < parts.length; i++) {
      const partNum = parseInt(parts[i], 10);
      if (!isNaN(partNum) && partNum >= 0 && partNum <= 36) {
        return partNum;
      }
      // Try pattern match in this part too
      const partMatch = parts[i].match(/\b(\d{1,2})\b/);
      if (partMatch) {
        const num = parseInt(partMatch[1], 10);
        if (num >= 0 && num <= 36) {
          return num;
        }
      }
    }
  }

  return null;
}

/**
 * Derive all roulette attributes from winning number
 * This is the single source of truth for result attributes
 */
export function deriveRouletteAttributes(winningNumber: number): RouletteResult {
  if (winningNumber < 0 || winningNumber > 36) {
    throw new Error(`Invalid roulette number: ${winningNumber}. Must be 0-36.`);
  }

  // Handle zero (green)
  if (winningNumber === 0) {
    return {
      number: 0,
      color: 'Green',
      parity: 'Zero',
      range: 'Zero',
      dozen: 'Zero',
      column: 'Zero'
    };
  }

  // Determine color
  let color: 'Red' | 'Black' | 'Green';
  if (ROULETTE_LAYOUT.red.includes(winningNumber)) {
    color = 'Red';
  } else if (ROULETTE_LAYOUT.black.includes(winningNumber)) {
    color = 'Black';
  } else {
    color = 'Green'; // Shouldn't happen for 1-36, but safety
  }

  // Determine parity
  const parity: 'Odd' | 'Even' = winningNumber % 2 === 0 ? 'Even' : 'Odd';

  // Determine range
  const range: '1 to 18' | '19 to 36' = winningNumber <= 18 ? '1 to 18' : '19 to 36';

  // Determine dozen (1-12, 13-24, 25-36)
  let dozen: '1st 12' | '2nd 12' | '3rd 12';
  if (winningNumber <= 12) {
    dozen = '1st 12';
  } else if (winningNumber <= 24) {
    dozen = '2nd 12';
  } else {
    dozen = '3rd 12';
  }

  // Determine column (1st, 2nd, 3rd)
  // Column 1: 1,4,7,10,13,16,19,22,25,28,31,34
  // Column 2: 2,5,8,11,14,17,20,23,26,29,32,35
  // Column 3: 3,6,9,12,15,18,21,24,27,30,33,36
  let column: '1st Column' | '2nd Column' | '3rd Column';
  const columnRemainder = winningNumber % 3;
  if (columnRemainder === 1) {
    column = '1st Column';
  } else if (columnRemainder === 2) {
    column = '2nd Column';
  } else {
    column = '3rd Column';
  }

  return {
    number: winningNumber,
    color,
    parity,
    range,
    dozen,
    column
  };
}

/**
 * Normalize bet coverage string for matching
 * Handles variations: "Red", "red", "RED", " Red ", etc.
 */
function normalizeBetCoverage(coverage: string): string {
  return coverage.trim().toLowerCase();
}

/**
 * Check if a number is in a comma-separated list
 * Example: "16,17,18" contains 17
 */
function isNumberInList(number: number, listString: string): boolean {
  const normalized = normalizeBetCoverage(listString);
  const numbers = normalized.split(',').map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n));
  return numbers.includes(number);
}

/**
 * Check if number matches a range string
 * Handles: "1 to 18", "1-18", "1-18", etc.
 */
function isNumberInRange(number: number, rangeString: string): boolean {
  const normalized = normalizeBetCoverage(rangeString);
  
  // Handle "1 to 18" format
  const toMatch = normalized.match(/(\d+)\s*to\s*(\d+)/);
  if (toMatch) {
    const start = parseInt(toMatch[1], 10);
    const end = parseInt(toMatch[2], 10);
    return number >= start && number <= end;
  }

  // Handle "1-18" format
  const dashMatch = normalized.match(/(\d+)\s*-\s*(\d+)/);
  if (dashMatch) {
    const start = parseInt(dashMatch[1], 10);
    const end = parseInt(dashMatch[2], 10);
    return number >= start && number <= end;
  }

  return false;
}

/**
 * Check if number matches a dozen string
 * Handles: "1st 12", "2nd 12", "3rd 12", "first 12", etc.
 */
function isNumberInDozen(number: number, dozenString: string): boolean {
  if (number === 0) return false;
  
  const normalized = normalizeBetCoverage(dozenString);
  
  if (normalized.includes('1st') || normalized.includes('first')) {
    return number >= 1 && number <= 12;
  }
  if (normalized.includes('2nd') || normalized.includes('second')) {
    return number >= 13 && number <= 24;
  }
  if (normalized.includes('3rd') || normalized.includes('third')) {
    return number >= 25 && number <= 36;
  }

  return false;
}

/**
 * Check if number matches a column string
 * Handles: "1st Column", "2nd Column", "3rd Column", "column 1", etc.
 */
function isNumberInColumn(number: number, columnString: string): boolean {
  if (number === 0) return false;
  
  const normalized = normalizeBetCoverage(columnString);
  const columnRemainder = number % 3;
  
  if (normalized.includes('1st') || normalized.includes('first') || normalized.includes('column 1')) {
    return columnRemainder === 1;
  }
  if (normalized.includes('2nd') || normalized.includes('second') || normalized.includes('column 2')) {
    return columnRemainder === 2;
  }
  if (normalized.includes('3rd') || normalized.includes('third') || normalized.includes('column 3')) {
    return columnRemainder === 0;
  }

  return false;
}

/**
 * Generic bet matching engine
 * Matches bet coverage (`n` field) against derived roulette result
 * 
 * Matching rules (in order of priority):
 * 1. Exact number match: "17" matches 17
 * 2. Number list match: "16,17,18" contains 17
 * 3. Color match: "Red", "Black", "Green"
 * 4. Parity match: "Odd", "Even"
 * 5. Range match: "1 to 18", "19 to 36"
 * 6. Dozen match: "1st 12", "2nd 12", "3rd 12"
 * 7. Column match: "1st Column", "2nd Column", "3rd Column"
 * 8. Case-insensitive string match for other labels
 */
export function isWinningBet(
  betCoverage: string,
  derivedResult: RouletteResult,
  betSide: 'back' | 'lay' = 'back'
): boolean {
  if (!betCoverage || typeof betCoverage !== 'string') {
    return false;
  }

  const normalized = normalizeBetCoverage(betCoverage);
  const { number, color, parity, range, dozen, column } = derivedResult;

  // 1. Exact number match (handle leading zeros: "02" = "2")
  // First check if betCoverage is a pure number (with or without leading zeros)
  if (/^\d+$/.test(normalized)) {
    const betNumber = parseInt(normalized, 10);
    if (!isNaN(betNumber) && betNumber === number) {
      return betSide === 'back';
    }
    // If it's a number but doesn't match, continue to other checks
    // (might be a number in a different format)
  }

  // 2. Number list match (comma-separated: "16,17,18")
  if (normalized.includes(',')) {
    const isInList = isNumberInList(number, betCoverage);
    return betSide === 'back' ? isInList : !isInList;
  }

  // 3. Color match
  const colorMatch = normalized === color.toLowerCase();
  if (colorMatch) {
    return betSide === 'back';
  }

  // 4. Parity match
  if (number !== 0) { // Zero has no parity
    const parityMatch = normalized === parity.toLowerCase();
    if (parityMatch) {
      return betSide === 'back';
    }
  }

  // 5. Range match
  const rangeMatch = isNumberInRange(number, betCoverage);
  if (rangeMatch) {
    return betSide === 'back';
  }

  // 6. Dozen match
  const dozenMatch = isNumberInDozen(number, betCoverage);
  if (dozenMatch) {
    return betSide === 'back';
  }

  // 7. Column match
  const columnMatch = isNumberInColumn(number, betCoverage);
  if (columnMatch) {
    return betSide === 'back';
  }

  // 8. Generic string match (case-insensitive)
  // For any other labels that might match
  const exactStringMatch = normalized === range.toLowerCase() ||
                          normalized === dozen.toLowerCase() ||
                          normalized === column.toLowerCase();
  
  if (exactStringMatch) {
    return betSide === 'back';
  }

  // No match found
  return betSide === 'lay';
}

/**
 * Complete roulette settlement function
 * Processes all bets for a roulette round
 */
export function settleRouletteBets(
  rdesc: string | null | undefined,
  bets: UserBet[],
  betDefinitions?: BetDefinition[]
): Array<{
  bet: UserBet;
  isWin: boolean;
  reason: string;
  payout?: number;
}> {
  // Step 1: Parse rdesc to get winning number
  const winningNumber = parseRouletteResult(rdesc);
  
  if (winningNumber === null) {
    return bets.map(bet => ({
      bet,
      isWin: false,
      reason: 'Could not parse winning number from rdesc'
    }));
  }

  // Step 2: Derive all attributes from winning number
  const derivedResult = deriveRouletteAttributes(winningNumber);

  // Step 3: Match each bet
  return bets.map(bet => {
    const betSide = (bet.side || 'back') as 'back' | 'lay';
    const betCoverage = bet.bet_type || '';
    
    // If bet definitions provided, try to find matching definition
    let actualCoverage = betCoverage;
    if (betDefinitions && betDefinitions.length > 0) {
      const definition = betDefinitions.find(def => def.n === betCoverage || def.label === betCoverage);
      if (definition) {
        actualCoverage = definition.n;
      }
    }

    const isWin = isWinningBet(actualCoverage, derivedResult, betSide);
    
    // Calculate payout if won
    let payout: number | undefined;
    if (isWin && bet.odds && bet.bet_amount) {
      payout = parseFloat((bet.bet_amount * bet.odds).toFixed(2));
    }

    return {
      bet,
      isWin,
      reason: isWin 
        ? `Bet "${betCoverage}" matched result: ${winningNumber} (${derivedResult.color}, ${derivedResult.parity})`
        : `Bet "${betCoverage}" did not match result: ${winningNumber}`,
      payout
    };
  });
}

/**
 * Integration helper: Check if table is roulette type
 * Handles variations: roulette, roul, roulet, beach-roulette, etc.
 */
export function isRouletteTable(tableId: string): boolean {
  if (!tableId || typeof tableId !== 'string') {
    return false;
  }
  
  const rouletteKeywords = [
    'roulette',    // Standard: roulette12, roulette13, etc.
    'roul',        // Short: roul, roul12
    'roulet',      // Variation: roulet12
    'beach',       // Beach roulette
    'ourroullete', // Typo variation found in tables
    'roullete'     // Another typo variation
  ];
  
  const lowerTableId = tableId.toLowerCase().trim();
  return rouletteKeywords.some(keyword => lowerTableId.includes(keyword));
}

