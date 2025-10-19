import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LiveBet {
  id: string;
  username: string;
  bet_amount: number;
  cashout_multiplier?: number;
  status: 'active' | 'cashed_out' | 'crashed';
  created_at?: string;
}

interface LiveBetsPanelProps {
  liveBets: LiveBet[];
  totalPlayers: number;
  totalBetsAmount: number;
}

const LiveBetsPanel = ({ liveBets, totalPlayers, totalBetsAmount }: LiveBetsPanelProps) => {
  return null;
};

export default LiveBetsPanel;