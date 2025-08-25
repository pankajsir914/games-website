/**
 * Utility functions for formatting points display
 */

export const formatPoints = (points: number): string => {
  return Math.floor(points).toLocaleString();
};

export const formatPointsWithIcon = (points: number): string => {
  return `${formatPoints(points)} pts`;
};

export const getPointsSymbol = (): string => {
  return 'pts';
};

export const convertToPoints = (amount: number): number => {
  // For conversion purposes, 1 rupee = 1 point
  return Math.floor(amount);
};