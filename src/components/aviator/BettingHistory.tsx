import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BetHistoryItem {
  id: string;
  username: string;
  bet_amount: number;
  cashout_multiplier?: number;
  payout_amount: number;
  status: 'active' | 'cashed_out' | 'crashed';
  created_at: string;
}

interface BettingHistoryProps {
  bets: BetHistoryItem[];
  currentRoundBets?: BetHistoryItem[];
}

const BettingHistory = ({ bets, currentRoundBets = [] }: BettingHistoryProps) => {
  const getPlayerInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatAmount = (amount: number) => {
    if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toString();
  };

  const maskUsername = (username: string) => {
    if (username.length <= 3) return username;
    return username.substring(0, 2) + '*'.repeat(username.length - 3) + username.slice(-1);
  };

  return null;
};

export default BettingHistory;