import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Card {
  suit: string;
  rank: number;
  name: string;
}

interface HandResult {
  hand_type: string;
  hand_rank: number;
  cards: Card[];
  kickers: number[];
  description: string;
}

class PokerHandEvaluator {
  // Hand rankings (higher is better)
  static HAND_RANKINGS = {
    HIGH_CARD: 1,
    PAIR: 2,
    TWO_PAIR: 3,
    THREE_OF_A_KIND: 4,
    STRAIGHT: 5,
    FLUSH: 6,
    FULL_HOUSE: 7,
    FOUR_OF_A_KIND: 8,
    STRAIGHT_FLUSH: 9,
    ROYAL_FLUSH: 10
  };

  // Evaluate the best 5-card hand from available cards
  static evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
    const allCards = [...holeCards, ...communityCards];
    
    // Generate all possible 5-card combinations
    const combinations = this.getCombinations(allCards, 5);
    let bestHand: HandResult | null = null;

    for (const combination of combinations) {
      const handResult = this.evaluateFiveCardHand(combination);
      
      if (!bestHand || this.compareHands(handResult, bestHand) > 0) {
        bestHand = handResult;
      }
    }

    return bestHand!;
  }

  // Generate all combinations of k elements from array
  static getCombinations<T>(array: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (k > array.length) return [];
    
    const [first, ...rest] = array;
    const withFirst = this.getCombinations(rest, k - 1).map(combo => [first, ...combo]);
    const withoutFirst = this.getCombinations(rest, k);
    
    return [...withFirst, ...withoutFirst];
  }

  // Evaluate a specific 5-card hand
  static evaluateFiveCardHand(cards: Card[]): HandResult {
    const sortedCards = [...cards].sort((a, b) => b.rank - a.rank);
    const ranks = sortedCards.map(card => card.rank);
    const suits = sortedCards.map(card => card.suit);

    // Count ranks and suits
    const rankCounts = this.countRanks(ranks);
    const suitCounts = this.countSuits(suits);

    const isFlush = Object.values(suitCounts).some(count => count === 5);
    const isStraight = this.isStraight(ranks);
    const isRoyalStraight = ranks.every(rank => [14, 13, 12, 11, 10].includes(rank));

    // Check for each hand type (highest to lowest)
    if (isFlush && isStraight && isRoyalStraight) {
      return {
        hand_type: 'Royal Flush',
        hand_rank: this.HAND_RANKINGS.ROYAL_FLUSH,
        cards: sortedCards,
        kickers: [],
        description: 'Royal Flush'
      };
    }

    if (isFlush && isStraight) {
      return {
        hand_type: 'Straight Flush',
        hand_rank: this.HAND_RANKINGS.STRAIGHT_FLUSH,
        cards: sortedCards,
        kickers: [Math.max(...ranks)],
        description: `Straight Flush, ${this.rankToString(Math.max(...ranks))} high`
      };
    }

    const rankCountValues = Object.values(rankCounts);
    if (rankCountValues.includes(4)) {
      const fourOfAKindRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 4)!);
      const kicker = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 1)!);
      
      return {
        hand_type: 'Four of a Kind',
        hand_rank: this.HAND_RANKINGS.FOUR_OF_A_KIND,
        cards: sortedCards,
        kickers: [fourOfAKindRank, kicker],
        description: `Four of a Kind, ${this.rankToString(fourOfAKindRank)}s`
      };
    }

    if (rankCountValues.includes(3) && rankCountValues.includes(2)) {
      const threeOfAKindRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 3)!);
      const pairRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 2)!);
      
      return {
        hand_type: 'Full House',
        hand_rank: this.HAND_RANKINGS.FULL_HOUSE,
        cards: sortedCards,
        kickers: [threeOfAKindRank, pairRank],
        description: `Full House, ${this.rankToString(threeOfAKindRank)}s full of ${this.rankToString(pairRank)}s`
      };
    }

    if (isFlush) {
      return {
        hand_type: 'Flush',
        hand_rank: this.HAND_RANKINGS.FLUSH,
        cards: sortedCards,
        kickers: ranks,
        description: `Flush, ${this.rankToString(ranks[0])} high`
      };
    }

    if (isStraight) {
      const highCard = Math.max(...ranks);
      return {
        hand_type: 'Straight',
        hand_rank: this.HAND_RANKINGS.STRAIGHT,
        cards: sortedCards,
        kickers: [highCard],
        description: `Straight, ${this.rankToString(highCard)} high`
      };
    }

    if (rankCountValues.includes(3)) {
      const threeOfAKindRank = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 3)!);
      const kickers = Object.keys(rankCounts)
        .filter(rank => rankCounts[rank] === 1)
        .map(rank => parseInt(rank))
        .sort((a, b) => b - a);
      
      return {
        hand_type: 'Three of a Kind',
        hand_rank: this.HAND_RANKINGS.THREE_OF_A_KIND,
        cards: sortedCards,
        kickers: [threeOfAKindRank, ...kickers],
        description: `Three of a Kind, ${this.rankToString(threeOfAKindRank)}s`
      };
    }

    const pairs = Object.keys(rankCounts)
      .filter(rank => rankCounts[rank] === 2)
      .map(rank => parseInt(rank))
      .sort((a, b) => b - a);

    if (pairs.length === 2) {
      const kicker = parseInt(Object.keys(rankCounts).find(rank => rankCounts[rank] === 1)!);
      
      return {
        hand_type: 'Two Pair',
        hand_rank: this.HAND_RANKINGS.TWO_PAIR,
        cards: sortedCards,
        kickers: [...pairs, kicker],
        description: `Two Pair, ${this.rankToString(pairs[0])}s and ${this.rankToString(pairs[1])}s`
      };
    }

    if (pairs.length === 1) {
      const pairRank = pairs[0];
      const kickers = Object.keys(rankCounts)
        .filter(rank => rankCounts[rank] === 1)
        .map(rank => parseInt(rank))
        .sort((a, b) => b - a);
      
      return {
        hand_type: 'Pair',
        hand_rank: this.HAND_RANKINGS.PAIR,
        cards: sortedCards,
        kickers: [pairRank, ...kickers],
        description: `Pair of ${this.rankToString(pairRank)}s`
      };
    }

    // High card
    return {
      hand_type: 'High Card',
      hand_rank: this.HAND_RANKINGS.HIGH_CARD,
      cards: sortedCards,
      kickers: ranks,
      description: `${this.rankToString(ranks[0])} high`
    };
  }

  // Count occurrences of each rank
  static countRanks(ranks: number[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const rank of ranks) {
      counts[rank.toString()] = (counts[rank.toString()] || 0) + 1;
    }
    return counts;
  }

  // Count occurrences of each suit
  static countSuits(suits: string[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const suit of suits) {
      counts[suit] = (counts[suit] || 0) + 1;
    }
    return counts;
  }

  // Check if ranks form a straight
  static isStraight(ranks: number[]): boolean {
    const uniqueRanks = [...new Set(ranks)].sort((a, b) => a - b);
    
    if (uniqueRanks.length !== 5) return false;

    // Check for normal straight
    for (let i = 1; i < uniqueRanks.length; i++) {
      if (uniqueRanks[i] - uniqueRanks[i - 1] !== 1) {
        // Check for wheel (A-2-3-4-5)
        if (uniqueRanks.toString() === '2,3,4,5,14') {
          return true;
        }
        return false;
      }
    }
    
    return true;
  }

  // Compare two hands (-1, 0, 1)
  static compareHands(hand1: HandResult, hand2: HandResult): number {
    if (hand1.hand_rank !== hand2.hand_rank) {
      return hand1.hand_rank - hand2.hand_rank;
    }

    // Same hand type, compare kickers
    for (let i = 0; i < Math.max(hand1.kickers.length, hand2.kickers.length); i++) {
      const kicker1 = hand1.kickers[i] || 0;
      const kicker2 = hand2.kickers[i] || 0;
      
      if (kicker1 !== kicker2) {
        return kicker1 - kicker2;
      }
    }

    return 0; // Tie
  }

  // Convert rank number to string
  static rankToString(rank: number): string {
    switch (rank) {
      case 14: return 'Ace';
      case 13: return 'King';
      case 12: return 'Queen';
      case 11: return 'Jack';
      default: return rank.toString();
    }
  }

  // Find winners from multiple hands
  static findWinners(hands: { player_id: string; hand: HandResult }[]): string[] {
    if (hands.length === 0) return [];
    if (hands.length === 1) return [hands[0].player_id];

    let bestHand = hands[0].hand;
    let winners = [hands[0].player_id];

    for (let i = 1; i < hands.length; i++) {
      const comparison = this.compareHands(hands[i].hand, bestHand);
      
      if (comparison > 0) {
        // New best hand
        bestHand = hands[i].hand;
        winners = [hands[i].player_id];
      } else if (comparison === 0) {
        // Tie with current best
        winners.push(hands[i].player_id);
      }
    }

    return winners;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    let result;

    switch (action) {
      case 'evaluate_hand':
        result = {
          success: true,
          hand: PokerHandEvaluator.evaluateHand(params.hole_cards, params.community_cards)
        };
        break;

      case 'compare_hands':
        const comparison = PokerHandEvaluator.compareHands(params.hand1, params.hand2);
        result = {
          success: true,
          comparison,
          winner: comparison > 0 ? 'hand1' : comparison < 0 ? 'hand2' : 'tie'
        };
        break;

      case 'find_winners':
        const winners = PokerHandEvaluator.findWinners(params.hands);
        result = {
          success: true,
          winners
        };
        break;

      default:
        result = { success: false, error: 'Invalid action' };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in poker hand evaluator:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});