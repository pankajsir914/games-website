/**
 * Industry-Standard Bet Matching System
 * 
 * Flow:
 * 1. Game Result → Extract rdesc (string)
 * 2. Parse rdesc → Extract winner and bet results
 * 3. Compare with bet option → Match bet type with parsed results
 * 4. Determine WIN / LOSE
 */

export interface ParsedRdesc {
  winner: string | null;
  results: Array<{
    betOption: string | null;
    result: string | null;
  }>;
  fullText: string | null;
}

export interface BetMatchResult {
  isWin: boolean;
  matchedResult: string | null;
  matchType: 'winner' | 'bet_option' | 'none';
  reason: string;
}

/**
 * Parse rdesc string to extract winner and bet results
 * 
 * Expected format: "Winner#B : Over 21(32)#A : Under 21(10)"
 * - First part (before first '#') = Winner
 * - Subsequent parts = "BetCode : Result"
 * 
 * @param rdesc - The result description string from game result
 * @returns Parsed rdesc with winner and bet results
 */
export function parseRdesc(rdesc: string | null | undefined): ParsedRdesc {
  if (!rdesc || typeof rdesc !== 'string') {
    return {
      winner: null,
      results: [],
      fullText: null
    };
  }

  const trimmedRdesc = rdesc.trim();
  
  if (!trimmedRdesc) {
    return {
      winner: null,
      results: [],
      fullText: trimmedRdesc
    };
  }

  // Split by '#' to separate winner from bet results
  const parts = trimmedRdesc.split('#').map((p) => p.trim()).filter(Boolean);

  if (parts.length === 0) {
    return {
      winner: null,
      results: [],
      fullText: trimmedRdesc
    };
  }

  // First part is the winner
  const winner = parts[0] || null;

  // Parse subsequent parts as "BetCode : Result"
  const results = parts.slice(1).map((segment) => {
    // Handle formats like "B : Over 21(32)" or "B:Over 21(32)"
    const colonIndex = segment.indexOf(':');
    
    if (colonIndex === -1) {
      // No colon found - treat entire segment as bet option
      return {
        betOption: segment.trim(),
        result: null
      };
    }

    const betOption = segment.substring(0, colonIndex).trim();
    const result = segment.substring(colonIndex + 1).trim();

    return {
      betOption: betOption || null,
      result: result || null
    };
  });

  return {
    winner: winner || null,
    results,
    fullText: trimmedRdesc
  };
}

/**
 * Normalize string for comparison (case-insensitive, trimmed)
 */
function normalizeString(str: string | null | undefined): string {
  if (!str) return '';
  return str.toString().trim().toLowerCase();
}

/**
 * Match bet against parsed rdesc results
 * 
 * Matching logic:
 * 1. First try to match against winner
 * 2. Then try to match against bet option results
 * 3. For BACK bets: Match means WIN
 * 4. For LAY bets: No match means WIN
 * 
 * @param betType - The bet type/option from the bet
 * @param betSide - 'back' or 'lay'
 * @param parsedRdesc - Parsed rdesc from game result
 * @returns Bet match result with WIN/LOSE determination
 */
export function matchBetAgainstRdesc(
  betType: string | null | undefined,
  betSide: 'back' | 'lay' | null | undefined,
  parsedRdesc: ParsedRdesc
): BetMatchResult {
  const normalizedBetType = normalizeString(betType);
  const side = (betSide || 'back').toLowerCase() as 'back' | 'lay';

  // If no rdesc data, bet loses
  if (!parsedRdesc.winner && parsedRdesc.results.length === 0) {
    return {
      isWin: false,
      matchedResult: null,
      matchType: 'none',
      reason: 'No result data available in rdesc'
    };
  }

  // Try matching against winner first
  const normalizedWinner = normalizeString(parsedRdesc.winner);
  if (normalizedWinner && normalizedBetType === normalizedWinner) {
    const isWin = side === 'back';
    return {
      isWin,
      matchedResult: parsedRdesc.winner,
      matchType: 'winner',
      reason: side === 'back' 
        ? `BACK bet matched winner: ${parsedRdesc.winner}` 
        : `LAY bet matched winner (loses): ${parsedRdesc.winner}`
    };
  }

  // Try matching against bet option results
  for (const result of parsedRdesc.results) {
    const normalizedBetOption = normalizeString(result.betOption);
    
    // Match bet type against bet option code (e.g., "B", "A")
    if (normalizedBetOption && normalizedBetType === normalizedBetOption) {
      const isWin = side === 'back';
      return {
        isWin,
        matchedResult: result.result || result.betOption,
        matchType: 'bet_option',
        reason: side === 'back'
          ? `BACK bet matched bet option: ${result.betOption}`
          : `LAY bet matched bet option (loses): ${result.betOption}`
      };
    }

    // Also try matching against the result value itself (e.g., "Over 21(32)")
    const normalizedResult = normalizeString(result.result);
    if (normalizedResult && normalizedBetType === normalizedResult) {
      const isWin = side === 'back';
      return {
        isWin,
        matchedResult: result.result,
        matchType: 'bet_option',
        reason: side === 'back'
          ? `BACK bet matched result: ${result.result}`
          : `LAY bet matched result (loses): ${result.result}`
      };
    }

    // Try partial matching (e.g., betType "Over 21" matches "Over 21(32)")
    if (normalizedResult && normalizedBetType && normalizedResult.includes(normalizedBetType)) {
      const isWin = side === 'back';
      return {
        isWin,
        matchedResult: result.result,
        matchType: 'bet_option',
        reason: side === 'back'
          ? `BACK bet partially matched result: ${result.result}`
          : `LAY bet partially matched result (loses): ${result.result}`
      };
    }
  }

  // No match found
  const isWin = side === 'lay';
  return {
    isWin,
    matchedResult: null,
    matchType: 'none',
    reason: side === 'back'
      ? `BACK bet did not match any result (loses)`
      : `LAY bet did not match any result (wins)`
  };
}

/**
 * Extract rdesc from game result data
 * 
 * Tries multiple paths to find rdesc:
 * 1. data.t1.rdesc (detailed result API)
 * 2. data.rdesc
 * 3. t1.rdesc
 * 4. rdesc
 * 
 * @param resultData - Game result data from API
 * @returns rdesc string or null
 */
export function extractRdesc(resultData: any): string | null {
  if (!resultData) return null;

  // Try multiple paths
  const paths = [
    resultData?.data?.t1?.rdesc,
    resultData?.data?.rdesc,
    resultData?.t1?.rdesc,
    resultData?.rdesc
  ];

  for (const rdesc of paths) {
    if (rdesc && typeof rdesc === 'string' && rdesc.trim()) {
      return rdesc.trim();
    }
  }

  return null;
}

/**
 * Complete bet matching flow (Industry Standard)
 * 
 * Flow:
 * 1. Game Result → Extract rdesc
 * 2. Parse rdesc → Get winner and bet results
 * 3. Compare with bet option → Match bet type
 * 4. Determine WIN / LOSE
 * 
 * @param betType - The bet type/option
 * @param betSide - 'back' or 'lay'
 * @param resultData - Game result data from API
 * @returns Bet match result
 */
export function processBetMatching(
  betType: string | null | undefined,
  betSide: 'back' | 'lay' | null | undefined,
  resultData: any
): BetMatchResult {
  // Step 1: Extract rdesc from game result
  const rdesc = extractRdesc(resultData);
  
  if (!rdesc) {
    return {
      isWin: false,
      matchedResult: null,
      matchType: 'none',
      reason: 'No rdesc found in game result'
    };
  }

  // Step 2: Parse rdesc
  const parsedRdesc = parseRdesc(rdesc);

  // Step 3 & 4: Compare with bet option and determine WIN/LOSE
  return matchBetAgainstRdesc(betType, betSide, parsedRdesc);
}

