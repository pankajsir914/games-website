import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import type { ColorPredictionRound, ColorPredictionBet, BetPlaceResponse } from '@/types/colorPrediction';

export const useColorPrediction = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState(30);

  // Fetch game settings for round duration
  const { data: gameSettings } = useQuery({
    queryKey: ['color-prediction-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('game_settings')
        .select('settings')
        .eq('game_type', 'color_prediction')
        .single();

      if (error) {
        console.error('Error fetching game settings:', error);
        return { round_duration: 30, result_display_time: 5 };
      }
      
      const settings = data?.settings as Record<string, unknown> | null;
      return {
        round_duration: (settings?.round_duration as number) || 30,
        result_display_time: (settings?.result_display_time as number) || 5,
      };
    },
    staleTime: 30000, // Cache for 30 seconds
  });

  const roundDuration = gameSettings?.round_duration || 30;

  // Fetch current active round
  const { data: currentRound, isLoading: roundLoading } = useQuery({
    queryKey: ['color-prediction-current-round'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('color_prediction_rounds')
        .select('*')
        .in('status', ['betting', 'drawing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current round:', error);
        return null;
      }
      console.log('Current round:', data);
      return data as ColorPredictionRound | null;
    },
    refetchInterval: 2000,
  });

  // Fetch last completed round
  const { data: lastCompletedRound } = useQuery({
    queryKey: ['color-prediction-last-completed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('color_prediction_rounds')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching last completed round:', error);
        return null;
      }
      console.log('Last completed round:', data);
      return data as ColorPredictionRound | null;
    },
    refetchInterval: 2000,
  });

  // Fetch recent rounds for history
  const { data: recentRounds } = useQuery({
    queryKey: ['color-prediction-recent-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('color_prediction_rounds')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as ColorPredictionRound[];
    },
  });

  // Fetch user's bet for current round
  const { data: userBet } = useQuery({
    queryKey: ['color-prediction-user-bet', currentRound?.id],
    queryFn: async () => {
      if (!user?.id || !currentRound?.id) return null;

      const { data, error } = await supabase
        .from('color_prediction_bets')
        .select('*')
        .eq('round_id', currentRound.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user bet:', error);
        return null;
      }
      return data as ColorPredictionBet | null;
    },
    enabled: !!user?.id && !!currentRound?.id,
  });

  // Fetch user's bet history
  const { data: userBetHistory } = useQuery({
    queryKey: ['color-prediction-user-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('color_prediction_bets')
        .select(`
          *,
          color_prediction_rounds!inner(period, winning_color, draw_time)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Place bet mutation
  const placeBet = useMutation({
    mutationFn: async ({
      roundId,
      color,
      amount
    }: {
      roundId: string;
      color: 'red' | 'green' | 'violet';
      amount: number;
    }) => {
      const { data, error } = await supabase.rpc('place_color_prediction_bet', {
        p_round_id: roundId,
        p_color: color,
        p_bet_amount: amount,
      });

      if (error) throw error;
      return data as unknown as BetPlaceResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['color-prediction-user-bet'] });
      queryClient.invalidateQueries({ queryKey: ['color-prediction-current-round'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      
      toast({
        title: "Bet Placed Successfully!",
        description: `₹${data.bet_amount} bet placed on ${data.color} with ${data.multiplier}x multiplier`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bet Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Timer effect - use dynamic round duration
  useEffect(() => {
    if (!currentRound) return;

    const calculateTimeLeft = () => {
      const endTime = new Date(currentRound.bet_end_time).getTime();
      const now = new Date().getTime();
      const difference = endTime - now;
      
      if (difference > 0) {
        setTimeLeft(Math.ceil(difference / 1000));
      } else {
        setTimeLeft(0);
        // If round is expired and still in betting state, invalidate queries to fetch fresh data
        if (currentRound.status === 'betting') {
          queryClient.invalidateQueries({ queryKey: ['color-prediction-current-round'] });
        }
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [currentRound, queryClient]);

  // Auto-check for expired rounds - reduced interval
  useEffect(() => {
    const checkExpiredRounds = () => {
      if (currentRound?.status === 'betting') {
        const betEndTime = new Date(currentRound.bet_end_time).getTime();
        const now = Date.now();

        // If betting time has expired but status is still betting
        if (now > betEndTime + 30000) { // 30 second grace period (reduced from 60)
          queryClient.invalidateQueries({ queryKey: ['color-prediction-current-round'] });
        }
      }
    };

    checkExpiredRounds();
    const interval = setInterval(checkExpiredRounds, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [currentRound, queryClient]);

  // Auto-manage rounds - call edge function every 5 seconds (reduced from 35)
  useEffect(() => {
    let isManaging = false;
    
    const autoManage = async () => {
      // Prevent concurrent calls
      if (isManaging) return;
      
      isManaging = true;
      try {
        const { data: session } = await supabase.auth.getSession();
        const response = await fetch('https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/color-prediction-manager?action=auto_manage', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaW9qaWhncGVlaHZwd2VqZXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjM0NTEsImV4cCI6MjA2ODU5OTQ1MX0.izGAao4U7k8gn4UIb7kgPs-w1ZEg0GzmAhkZ_Ff_Oxk',
          }
        });
        
        if (!response.ok) {
          console.error('Auto-manage error:', await response.text());
        }
      } catch (error) {
        console.error('Auto-manage error:', error);
      } finally {
        isManaging = false;
      }
    };

    // Run immediately and then every 5 seconds
    autoManage();
    const interval = setInterval(autoManage, 5000);

    return () => clearInterval(interval);
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    const roundsChannel = supabase
      .channel('color-prediction-rounds-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'color_prediction_rounds',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['color-prediction-current-round'] });
          queryClient.invalidateQueries({ queryKey: ['color-prediction-recent-rounds'] });
          queryClient.invalidateQueries({ queryKey: ['color-prediction-last-completed'] });
        }
      )
      .subscribe();

    const betsChannel = supabase
      .channel('color-prediction-bets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'color_prediction_bets',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['color-prediction-user-bet'] });
          queryClient.invalidateQueries({ queryKey: ['color-prediction-user-history'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roundsChannel);
      supabase.removeChannel(betsChannel);
    };
  }, [queryClient]);

  return {
    currentRound,
    lastCompletedRound,
    recentRounds: recentRounds || [],
    userBet,
    userBetHistory: userBetHistory || [],
    timeLeft,
    roundLoading,
    placeBet: placeBet.mutate,
    isPlacingBet: placeBet.isPending,
    roundDuration, // Export for GameTimer
  };
};
