import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface BetLimits {
  max_bet_amount: number;
  daily_limit: number | null;
  weekly_limit: number | null;
  monthly_limit: number | null;
  is_custom: boolean;
}

export const useBetLimits = (userId?: string) => {
  const queryClient = useQueryClient();

  const limitsQuery = useQuery({
    queryKey: ["bet-limits", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_bet_limits", { p_user_id: userId });
      if (error) throw error;
      const fallback: BetLimits = {
        max_bet_amount: 5000,
        daily_limit: 20000,
        weekly_limit: 100000,
        monthly_limit: 300000,
        is_custom: false,
      };
      return data ? (data as unknown as BetLimits) : fallback;
    },
  });

  const setLimits = useMutation({
    mutationFn: async (params: {
      userId: string;
      maxBet: number;
      daily?: number | null;
      weekly?: number | null;
      monthly?: number | null;
      reason?: string | null;
    }) => {
      const { userId, maxBet, daily, weekly, monthly, reason } = params;
      const { data, error } = await supabase.rpc("set_user_bet_limits", {
        p_user_id: userId,
        p_max_bet: maxBet,
        p_daily_limit: daily ?? null,
        p_weekly_limit: weekly ?? null,
        p_monthly_limit: monthly ?? null,
        p_reason: reason ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bet-limits"] });
      toast({ title: "Limits updated", description: "Bet limits saved successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    },
  });

  return { ...limitsQuery, setLimits: setLimits.mutate, isSaving: setLimits.isPending };
};
