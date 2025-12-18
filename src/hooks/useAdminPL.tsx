import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminPLData {
  admin_id: string;
  total_deposits: number;
  total_withdrawals: number;
  total_revenue: number;
  net_pl: number;
  share_percentage: number; // Default percentage for profit/loss sharing
  amount_to_share: number; // Amount to be shared (positive = admin gives to master, negative = master gives to admin)
}

interface UseAdminPLParams {
  adminIds: string[];
  sharePercentage?: number; // Percentage to share (default 20%)
}

export const useAdminPL = ({ adminIds, sharePercentage = 20 }: UseAdminPLParams) => {
  return useQuery({
    queryKey: ['admin-pl', adminIds, sharePercentage],
    queryFn: async () => {
      if (!adminIds || adminIds.length === 0) {
        return [];
      }

      console.log('Fetching P&L for admins:', adminIds);

      const adminPLData: AdminPLData[] = [];

      for (const adminId of adminIds) {
        // Get users created by this admin
        const { data: myUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('created_by', adminId);
        
        const myUserIds = myUsers?.map(u => u.id) || [];

        if (myUserIds.length === 0) {
          adminPLData.push({
            admin_id: adminId,
            total_deposits: 0,
            total_withdrawals: 0,
            total_revenue: 0,
            net_pl: 0,
            share_percentage: sharePercentage,
            amount_to_share: 0
          });
          continue;
        }

        // Get total deposits (approved payment requests)
        const { data: approvedDeposits } = await supabase
          .from('payment_requests')
          .select('amount')
          .eq('status', 'approved')
          .in('user_id', myUserIds);

        const totalDeposits = approvedDeposits?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;

        // Get total withdrawals (approved withdrawal requests)
        const { data: approvedWithdrawals } = await supabase
          .from('withdrawal_requests')
          .select('amount')
          .eq('status', 'approved')
          .in('user_id', myUserIds);

        const totalWithdrawals = approvedWithdrawals?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;

        // Get all-time revenue from bets (house edge)
        const { data: aviatorBets } = await supabase
          .from('aviator_bets')
          .select('bet_amount, payout_amount')
          .in('user_id', myUserIds);

        const { data: colorBets } = await supabase
          .from('color_prediction_bets')
          .select('bet_amount, payout_amount')
          .in('user_id', myUserIds);

        const { data: andarBets } = await supabase
          .from('andar_bahar_bets')
          .select('bet_amount, payout_amount')
          .in('user_id', myUserIds);

        const { data: rouletteBets } = await supabase
          .from('roulette_bets')
          .select('bet_amount, payout_amount')
          .in('user_id', myUserIds);

        // Calculate revenue (total bets - total payouts)
        const allBets = [
          ...(aviatorBets || []),
          ...(colorBets || []),
          ...(andarBets || []),
          ...(rouletteBets || [])
        ];

        const totalBets = allBets.reduce((sum, bet) => sum + Number(bet.bet_amount || 0), 0);
        const totalPayouts = allBets.reduce((sum, bet) => sum + Number(bet.payout_amount || 0), 0);
        const totalRevenue = totalBets - totalPayouts;

        // Calculate Net P&L: Deposits - Withdrawals + Revenue
        const netPL = totalDeposits - totalWithdrawals + totalRevenue;

        // Calculate amount to share
        // If profit: admin gives sharePercentage% to master admin (positive)
        // If loss: master admin gives sharePercentage% to admin (negative)
        const amountToShare = netPL > 0 
          ? (netPL * sharePercentage) / 100  // Admin gives to master
          : (netPL * sharePercentage) / 100;  // Master gives to admin (negative value)

        adminPLData.push({
          admin_id: adminId,
          total_deposits: totalDeposits,
          total_withdrawals: totalWithdrawals,
          total_revenue: totalRevenue,
          net_pl: netPL,
          share_percentage: sharePercentage,
          amount_to_share: amountToShare
        });
      }

      console.log('Admin P&L data:', adminPLData);
      return adminPLData;
    },
    enabled: adminIds.length > 0,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

