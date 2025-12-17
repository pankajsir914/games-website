import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface BettingOdds {
  id: string;
  sport_type: string;
  match_id: string;
  bet_type: string;
  team_name?: string;
  odds: number;
  is_active: boolean;
}

export interface MockBet {
  id: string;
  user_id: string;
  sport_type: string;
  match_id: string;
  bet_type: string;
  team_name?: string;
  odds_at_bet: number;
  bet_amount: number;
  potential_payout: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  result_amount: number;
  created_at: string;
}

export function useBettingOdds(sportType: string, matchId: string) {
  const [odds, setOdds] = useState<BettingOdds[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOdds = async () => {
      if (!sportType || !matchId) return;
      
      const { data } = await supabase
        .from('sports_betting_odds')
        .select('*')
        .eq('sport_type', sportType)
        .eq('match_id', matchId)
        .eq('is_active', true);
      
      setOdds(data || []);
      setLoading(false);
    };

    fetchOdds();
  }, [sportType, matchId]);

  return { odds, loading };
}

export function useMockBetting() {
  const { user } = useAuth();
  const [userBets, setUserBets] = useState<MockBet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserBets = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('sports_mock_bets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setUserBets((data || []) as MockBet[]);
  };

  useEffect(() => {
    fetchUserBets();
  }, [user]);

  const placeMockBet = async (bet: {
    sport_type: string;
    match_id: string;
    bet_type: string;
    team_name?: string;
    odds: number;
    amount: number;
  }) => {
    if (!user) {
      toast.error('Please sign in to place bets');
      return { success: false };
    }

    setLoading(true);
    
    try {
      const potential_payout = bet.amount * bet.odds;
      
      const { error } = await supabase
        .from('sports_mock_bets')
        .insert({
          user_id: user.id,
          sport_type: bet.sport_type,
          match_id: bet.match_id,
          bet_type: bet.bet_type,
          team_name: bet.team_name,
          odds_at_bet: bet.odds,
          bet_amount: bet.amount,
          potential_payout
        });

      if (error) throw error;

      toast.success('Mock bet placed successfully!');
      await fetchUserBets();
      return { success: true };
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to place bet');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const cancelBet = async (betId: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('sports_mock_bets')
        .update({ status: 'cancelled' })
        .eq('id', betId)
        .eq('user_id', user?.id)
        .eq('status', 'pending');

      if (error) throw error;

      toast.success('Bet cancelled successfully');
      await fetchUserBets();
      return { success: true };
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel bet');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    userBets,
    loading,
    placeMockBet,
    cancelBet,
    refreshBets: fetchUserBets
  };
}

export function useAdminBetting() {
  const [allBets, setAllBets] = useState<MockBet[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllBets = async () => {
    setLoading(true);
    
    try {
      const { data } = await supabase
        .from('sports_mock_bets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      setAllBets((data || []) as MockBet[]);
    } catch (error) {
      console.error('Failed to fetch bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOdds = async (odds: Partial<BettingOdds> & { id: string }) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('sports_betting_odds')
        .update(odds)
        .eq('id', odds.id);

      if (error) throw error;
      
      toast.success('Odds updated successfully');
      return { success: true };
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to update odds');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const createOdds = async (odds: Omit<BettingOdds, 'id'>) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('sports_betting_odds')
        .insert(odds);

      if (error) throw error;
      
      toast.success('Odds created successfully');
      return { success: true };
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to create odds');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const settleBet = async (betId: string, status: 'won' | 'lost', resultAmount: number = 0) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('sports_mock_bets')
        .update({ 
          status, 
          result_amount: resultAmount 
        })
        .eq('id', betId);

      if (error) throw error;
      
      toast.success(`Bet settled as ${status}`);
      await fetchAllBets();
      return { success: true };
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to settle bet');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBets();
  }, []);

  return {
    allBets,
    loading,
    updateOdds,
    createOdds,
    settleBet,
    refreshBets: fetchAllBets
  };
}