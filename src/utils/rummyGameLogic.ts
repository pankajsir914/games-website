
export class RummyGameLogic {
  private suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  private ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  createDeck() {
    const deck = [];
    let cardId = 1;

    // Create 2 decks (104 cards total)
    for (let deckNum = 0; deckNum < 2; deckNum++) {
      for (const suit of this.suits) {
        for (const rank of this.ranks) {
          deck.push({
            id: `card-${cardId++}`,
            suit,
            rank,
            value: this.getCardValue(rank),
            isJoker: false
          });
        }
      }
      
      // Add printed jokers (2 per deck)
      deck.push({
        id: `joker-${deckNum * 2 + 1}`,
        suit: 'joker',
        rank: 'Joker',
        value: 0,
        isJoker: true
      });
      deck.push({
        id: `joker-${deckNum * 2 + 2}`,
        suit: 'joker',
        rank: 'Joker',
        value: 0,
        isJoker: true
      });
    }

    return deck;
  }

  shuffleDeck(deck: any[]) {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  dealCards(deck: any[], numCards: number) {
    return deck.splice(0, numCards);
  }

  getCardValue(rank: string): number {
    switch (rank) {
      case 'A': return 1;
      case 'J': case 'Q': case 'K': return 10;
      default: return parseInt(rank) || 10;
    }
  }

  validateHand(cards: any[]): boolean {
    // Basic validation - check if we have valid sequences and sets
    // This is a simplified version - in a real game, you'd need more complex logic
    
    if (cards.length !== 13) return false;

    // Group cards by suit and rank
    const groupedBySuit = this.groupCardsBySuit(cards);
    const groupedByRank = this.groupCardsByRank(cards);

    // Check for at least one pure sequence
    const hasPureSequence = this.hasPureSequence(groupedBySuit);
    if (!hasPureSequence) return false;

    // Check for at least 2 sequences total
    const sequences = this.findSequences(groupedBySuit);
    if (sequences.length < 2) return false;

    return true;
  }

  private groupCardsBySuit(cards: any[]) {
    const grouped: { [key: string]: any[] } = {};
    cards.forEach(card => {
      if (!grouped[card.suit]) grouped[card.suit] = [];
      grouped[card.suit].push(card);
    });
    return grouped;
  }

  private groupCardsByRank(cards: any[]) {
    const grouped: { [key: string]: any[] } = {};
    cards.forEach(card => {
      if (!grouped[card.rank]) grouped[card.rank] = [];
      grouped[card.rank].push(card);
    });
    return grouped;
  }

  private hasPureSequence(groupedBySuit: { [key: string]: any[] }): boolean {
    for (const suit in groupedBySuit) {
      if (suit === 'joker') continue;
      const suitCards = groupedBySuit[suit];
      if (suitCards.length >= 3) {
        // Sort cards by value and check for consecutive sequence
        const sorted = suitCards
          .filter(card => !card.isJoker)
          .sort((a, b) => a.value - b.value);
        
        if (this.hasConsecutiveSequence(sorted, 3)) {
          return true;
        }
      }
    }
    return false;
  }

  private findSequences(groupedBySuit: { [key: string]: any[] }): any[][] {
    const sequences = [];
    for (const suit in groupedBySuit) {
      if (suit === 'joker') continue;
      const suitCards = groupedBySuit[suit];
      if (suitCards.length >= 3) {
        const sorted = suitCards.sort((a, b) => a.value - b.value);
        const sequence = this.extractSequence(sorted);
        if (sequence.length >= 3) {
          sequences.push(sequence);
        }
      }
    }
    return sequences;
  }

  private hasConsecutiveSequence(cards: any[], minLength: number): boolean {
    if (cards.length < minLength) return false;
    
    for (let i = 0; i <= cards.length - minLength; i++) {
      let consecutive = 1;
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[j].value === cards[j-1].value + 1) {
          consecutive++;
          if (consecutive >= minLength) return true;
        } else {
          break;
        }
      }
    }
    return false;
  }

  private extractSequence(cards: any[]): any[] {
    if (cards.length < 3) return [];
    
    const sequence = [cards[0]];
    for (let i = 1; i < cards.length; i++) {
      if (cards[i].value === cards[i-1].value + 1) {
        sequence.push(cards[i]);
      } else {
        if (sequence.length >= 3) break;
        sequence.length = 0;
        sequence.push(cards[i]);
      }
    }
    
    return sequence.length >= 3 ? sequence : [];
  }

  calculatePoints(cards: any[]): number {
    return cards.reduce((total, card) => total + card.value, 0);
  }

  selectWildJoker(deck: any[]) {
    // Select a random card as wild joker
    const randomIndex = Math.floor(Math.random() * deck.length);
    const wildJokerCard = deck[randomIndex];
    
    // Mark all cards of this rank as jokers
    deck.forEach(card => {
      if (card.rank === wildJokerCard.rank && card.suit !== 'joker') {
        card.isJoker = true;
      }
    });
    
    return wildJokerCard;
  }
}
