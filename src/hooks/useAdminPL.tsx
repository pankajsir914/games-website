import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdminPLData {
  admin_id: string;
  total_deposits: number;
  total_withdrawals: number;
  total_bets: number; // Total bets placed by users
  total_payouts: number; // Total payouts to users (user wins = admin loss)
  total_revenue: number; // Game profit = bets - payouts
  net_pl: number;
  share_percentage: number; // Default percentage for profit/loss sharing
  amount_to_share: number; // Amount to be shared (positive = admin gives to master, negative = master gives to admin)
  month: number;
  year: number;
}

interface UseAdminPLParams {
  adminIds: string[];
  sharePercentage?: number; // Percentage to share (default 20%)
  month?: number; // Month (1-12), if not provided, uses current month
  year?: number; // Year, if not provided, uses current year
}

export const useAdminPL = ({ adminIds, sharePercentage = 20, month, year }: UseAdminPLParams) => {
  return useQuery({
    queryKey: ['admin-pl', adminIds, sharePercentage, month, year],
    queryFn: async () => {
      if (!adminIds || adminIds.length === 0) {
        return [];
      }

      // Determine month and year for filtering
      const now = new Date();
      const selectedMonth = month || (now.getMonth() + 1); // 1-12
      const selectedYear = year || now.getFullYear();

      // Calculate start and end of the month
      const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

      console.log(`Fetching P&L for admins for ${selectedMonth}/${selectedYear}:`, adminIds);

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
            total_bets: 0,
            total_payouts: 0,
            total_revenue: 0,
            net_pl: 0,
            share_percentage: sharePercentage,
            amount_to_share: 0,
            month: selectedMonth,
            year: selectedYear
          });
          continue;
        }

        // Get total deposits (approved payment requests) for the selected month
        const { data: approvedDeposits } = await supabase
          .from('payment_requests')
          .select('amount, created_at')
          .eq('status', 'approved')
          .in('user_id', myUserIds)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const totalDeposits = approvedDeposits?.reduce((sum, d) => sum + Number(d.amount || 0), 0) || 0;

        // Get total withdrawals (approved withdrawal requests) for the selected month
        const { data: approvedWithdrawals } = await supabase
          .from('withdrawal_requests')
          .select('amount, created_at')
          .eq('status', 'approved')
          .in('user_id', myUserIds)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const totalWithdrawals = approvedWithdrawals?.reduce((sum, w) => sum + Number(w.amount || 0), 0) || 0;

        // Get monthly revenue from bets (house edge) for the selected month
        const { data: aviatorBets } = await supabase
          .from('aviator_bets')
          .select('bet_amount, payout_amount, created_at')
          .in('user_id', myUserIds)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const { data: colorBets } = await supabase
          .from('color_prediction_bets')
          .select('bet_amount, payout_amount, created_at')
          .in('user_id', myUserIds)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const { data: andarBets } = await supabase
          .from('andar_bahar_bets')
          .select('bet_amount, payout_amount, created_at')
          .in('user_id', myUserIds)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const { data: rouletteBets } = await supabase
          .from('roulette_bets')
          .select('bet_amount, payout_amount, created_at')
          .in('user_id', myUserIds)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        // Calculate game results
        // Simple concept: User wins = Admin loss, User loses = Admin profit
        const allBets = [
          ...(aviatorBets || []),
          ...(colorBets || []),
          ...(andarBets || []),
          ...(rouletteBets || [])
        ];

        const totalBets = allBets.reduce((sum, bet) => sum + Number(bet.bet_amount || 0), 0);
        const totalPayouts = allBets.reduce((sum, bet) => sum + Number(bet.payout_amount || 0), 0);
        
        // User wins (payouts) = Admin loss
        // User loses (bets kept) = Admin profit
        // Net game result = Total bets - Total payouts
        // Positive = admin profit (users lost more), Negative = admin loss (users won more)
        const gameProfit = totalBets - totalPayouts;

        // Calculate Net P&L: 
        // Deposits (money in) - Withdrawals (money out) + Game Profit (bets - payouts)
        // If gameProfit is negative (users won more), it reduces admin's P&L
        const netPL = totalDeposits - totalWithdrawals + gameProfit;

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
          total_bets: totalBets,
          total_payouts: totalPayouts,
          total_revenue: gameProfit, // Game profit = bets - payouts (positive = admin profit, negative = admin loss)
          net_pl: netPL,
          share_percentage: sharePercentage,
          amount_to_share: amountToShare,
          month: selectedMonth,
          year: selectedYear
        });
      }

      console.log('Admin P&L data:', adminPLData);
      return adminPLData;
    },
    enabled: adminIds.length > 0,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

