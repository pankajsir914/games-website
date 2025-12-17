
export type Player = 'red' | 'yellow' | 'green' | 'blue';
export type ActivePlayer = 'red' | 'yellow'; // For 2-player game

export type TokenPosition = 'base' | 'board' | 'home';

export interface Token {
  id: string;
  player: Player;
  position: TokenPosition;
  boardPosition: number | null;
  isHome: boolean;
  canMove: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  currentPlayer: ActivePlayer;
  diceValue: number;
  isRolling: boolean;
  winner: ActivePlayer | null;
  canRoll: boolean;
  selectedToken: string | null;
  lastRoll: number | null;
  consecutiveSixes: number;
}

export interface BoardCell {
  type: 'normal' | 'safe' | 'start' | 'home' | 'path';
  player?: Player;
  isActive?: boolean;
}
