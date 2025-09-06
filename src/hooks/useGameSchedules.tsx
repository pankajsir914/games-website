import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GameSchedule {
  id: string;
  game_type: string;
  schedule_type: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  is_recurring: boolean;
  recurrence_pattern?: any;
  action_config?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useGameSchedules = (gameType?: string) => {
  const queryClient = useQueryClient();

  const { data: schedules, isLoading, error } = useQuery({
    queryKey: ['game-schedules', gameType],
    queryFn: async () => {
      let query = supabase
        .from('game_schedules')
        .select('*')
        .order('start_time', { ascending: true });

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const createSchedule = useMutation({
    mutationFn: async (schedule: Omit<GameSchedule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('game_schedules')
        .insert({
          ...schedule,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-schedules'] });
      toast({
        title: "Schedule Created",
        description: "Game schedule has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GameSchedule> }) => {
      const { data, error } = await supabase
        .from('game_schedules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-schedules'] });
      toast({
        title: "Schedule Updated",
        description: "Game schedule has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('game_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-schedules'] });
      toast({
        title: "Schedule Deleted",
        description: "Game schedule has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    schedules,
    isLoading,
    error,
    createSchedule: createSchedule.mutate,
    updateSchedule: updateSchedule.mutate,
    deleteSchedule: deleteSchedule.mutate,
    isCreating: createSchedule.isPending,
    isUpdating: updateSchedule.isPending,
    isDeleting: deleteSchedule.isPending,
  };
};