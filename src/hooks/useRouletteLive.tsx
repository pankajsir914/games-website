import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useRouletteLive = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAutoManaging, setIsAutoManaging] = useState(false);

  // Fetch live bets
  const { data: liveBets } = useQuery({
    queryKey: ['roulette-live-bets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roulette_live_bets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Fetch online presence
  const { data: onlinePresence } = useQuery({
    queryKey: ['roulette-presence'],
    queryFn: async () => {
      const { data: presenceData, error: presenceError } = await supabase
        .from('roulette_presence')
        .select('*')
        .eq('is_active', true);

      if (presenceError) throw presenceError;
      
      // Fetch profiles separately for usernames
      const userIds = presenceData?.map(p => p.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      // Merge presence with profiles
      const presenceWithProfiles = presenceData?.map(presence => ({
        ...presence,
        username: profiles?.find(p => p.id === presence.user_id)?.full_name || 'Anonymous'
      })) || [];
      
      return presenceWithProfiles;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Update user presence
  const updatePresence = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      
      const { error } = await supabase.rpc('update_roulette_presence');
      if (error) throw error;
    },
  });

  // Auto-manage rounds
  const autoManageRounds = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('roulette-game-manager', {
        body: { action: 'auto_manage' }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roulette-current-round'] });
      queryClient.invalidateQueries({ queryKey: ['roulette-history'] });
    },
  });

  // Update presence periodically
  useEffect(() => {
    if (!user?.id) return;

    // Update immediately
    updatePresence.mutate();

    // Update every 20 seconds
    const interval = setInterval(() => {
      updatePresence.mutate();
    }, 20000);

    return () => clearInterval(interval);
  }, [user?.id]);

  // Auto-manage rounds periodically
  useEffect(() => {
    if (!isAutoManaging) return;

    const manageRounds = () => {
      autoManageRounds.mutate();
    };

    // Run immediately
    manageRounds();

    // Run every 5 seconds
    const interval = setInterval(manageRounds, 5000);

    return () => clearInterval(interval);
  }, [isAutoManaging]);

  // Calculate statistics
  const totalPlayers = new Set(liveBets?.map(bet => bet.user_id) || []).size;
  const totalBetAmount = liveBets?.reduce((sum, bet) => sum + Number(bet.bet_amount), 0) || 0;
  const onlineCount = onlinePresence?.length || 0;

  const recentPlayers = onlinePresence?.map(presence => ({
    id: presence.user_id,
    username: presence.username || 'Anonymous',
    isActive: presence.is_active
  })) || [];

  return {
    liveBets: liveBets || [],
    totalPlayers,
    totalBetAmount,
    onlineCount,
    recentPlayers,
    startAutoManagement: () => setIsAutoManaging(true),
    stopAutoManagement: () => setIsAutoManaging(false),
    isAutoManaging,
  };
};