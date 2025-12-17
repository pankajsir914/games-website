import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserCompleteDetails } from '@/hooks/useUserCompleteDetails';
import { formatDistanceToNow } from 'date-fns';
import { DollarSign, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface UserOverviewTabProps {
  data: UserCompleteDetails;
}

export const UserOverviewTab = ({ data }: UserOverviewTabProps) => {
  const { profile, wallet, stats } = data;
  
  const netProfit = stats.total_won - stats.total_lost;
  const isProfit = netProfit > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-xl sm:text-2xl">
              {profile.full_name?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">{profile.full_name}</h3>
              <Badge variant={profile.status === 'active' ? 'default' : 'destructive'}>
                {profile.status}
              </Badge>
            </div>
            
            <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
              <p className="break-all">Email: <span className="text-foreground">{profile.email}</span></p>
              <p>Phone: <span className="text-foreground">{profile.phone || 'Not provided'}</span></p>
              <p className="break-all">User ID: <span className="text-foreground font-mono text-xs">{profile.id}</span></p>
              {profile.created_by_name && (
                <p>Created by: <span className="text-foreground">{profile.created_by_name}</span></p>
              )}
              <p>Member since: <span className="text-foreground">
                {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
              </span></p>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Current Balance */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-primary/10">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Balance</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">₹{wallet.balance.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Total Bets */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-blue-500/10">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Bets</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{stats.total_bets}</p>
            </div>
          </div>
        </Card>

        {/* Total Won */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Won</p>
              <p className="text-lg sm:text-2xl font-bold text-green-500">₹{stats.total_won.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Net Profit/Loss */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-2 sm:p-3 rounded-lg ${isProfit ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              {isProfit ? (
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              )}
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Net P/L</p>
              <p className={`text-lg sm:text-2xl font-bold ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                {isProfit ? '+' : ''}₹{netProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card className="p-4 sm:p-6">
        <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-foreground">Financial Summary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <span className="text-xs sm:text-sm text-muted-foreground">Deposits</span>
            <span className="text-sm sm:text-base font-semibold text-foreground">₹{stats.total_deposits.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <span className="text-xs sm:text-sm text-muted-foreground">Withdrawals</span>
            <span className="text-sm sm:text-base font-semibold text-foreground">₹{stats.total_withdrawals.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <span className="text-xs sm:text-sm text-muted-foreground">Wagered</span>
            <span className="text-sm sm:text-base font-semibold text-foreground">₹{stats.total_lost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
            <span className="text-xs sm:text-sm text-muted-foreground">Payouts</span>
            <span className="text-sm sm:text-base font-semibold text-foreground">₹{stats.total_won.toLocaleString()}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
