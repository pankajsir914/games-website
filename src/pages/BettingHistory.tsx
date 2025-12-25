import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trophy, Target, Calendar, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const BettingHistory: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sports');
  
  // Date range state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  // Get date range for filtering
  const getDateRange = () => {
    if (!startDate && !endDate) return null;
    
    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;
    
    return { start, end };
  };

  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  // Fetch sports bets
  const { data: sportsBets, isLoading: sportsBetsLoading } = useQuery({
    queryKey: ['user-sports-bets', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('sports_bets')
        .select('*')
        .eq('user_id', user.id);
      
      const dateRange = getDateRange();
      if (dateRange?.start) {
        query = query.gte('created_at', dateRange.start.toISOString());
      }
      if (dateRange?.end) {
        query = query.lte('created_at', dateRange.end.toISOString());
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch casino bets
  const { data: casinoBets, isLoading: casinoBetsLoading } = useQuery({
    queryKey: ['user-casino-bets', user?.id, startDate, endDate],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const dateRange = getDateRange();
      const startISO = dateRange?.start?.toISOString();
      const endISO = dateRange?.end?.toISOString();
      
      const [aviator, roulette, teenPatti, andarBahar, colorPrediction] = await Promise.all([
        (async () => {
          let q = supabase.from('aviator_bets').select('*').eq('user_id', user.id);
          if (startISO) q = q.gte('created_at', startISO);
          if (endISO) q = q.lte('created_at', endISO);
          return q.order('created_at', { ascending: false }).limit(50);
        })(),
        (async () => {
          let q = supabase.from('roulette_bets').select('*').eq('user_id', user.id);
          if (startISO) q = q.gte('created_at', startISO);
          if (endISO) q = q.lte('created_at', endISO);
          return q.order('created_at', { ascending: false }).limit(50);
        })(),
        (async () => {
          let q = supabase.from('teen_patti_bets').select('*').eq('user_id', user.id);
          if (startISO) q = q.gte('created_at', startISO);
          if (endISO) q = q.lte('created_at', endISO);
          return q.order('created_at', { ascending: false }).limit(50);
        })(),
        (async () => {
          let q = supabase.from('andar_bahar_bets').select('*').eq('user_id', user.id);
          if (startISO) q = q.gte('created_at', startISO);
          if (endISO) q = q.lte('created_at', endISO);
          return q.order('created_at', { ascending: false }).limit(50);
        })(),
        (async () => {
          let q = supabase.from('color_prediction_bets').select('*').eq('user_id', user.id);
          if (startISO) q = q.gte('created_at', startISO);
          if (endISO) q = q.lte('created_at', endISO);
          return q.order('created_at', { ascending: false }).limit(50);
        })(),
      ]);

      const allBets = [
        ...(aviator.data || []).map(b => ({ ...b, game_type: 'Aviator' })),
        ...(roulette.data || []).map(b => ({ ...b, game_type: 'Roulette' })),
        ...(teenPatti.data || []).map(b => ({ ...b, game_type: 'Teen Patti' })),
        ...(andarBahar.data || []).map(b => ({ ...b, game_type: 'Andar Bahar' })),
        ...(colorPrediction.data || []).map(b => ({ ...b, game_type: 'Color Prediction' })),
      ];

      return allBets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-4 sm:py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please log in to view your betting history.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const hasDateFilter = startDate || endDate;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-3 sm:mb-4 text-sm sm:text-base"
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Betting History</h1>
              <p className="text-sm sm:text-base text-muted-foreground">View all your betting activity</p>
            </div>
            
            {/* Date Filter */}
            <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Calendar className="h-4 w-4 mr-2" />
                  {hasDateFilter ? 'Filtered' : 'Filter by Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 sm:w-96" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Date Range</Label>
                    {hasDateFilter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearDateFilter}
                        className="h-6 px-2 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="startDate" className="text-xs sm:text-sm">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-sm"
                        max={endDate || undefined}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label htmlFor="endDate" className="text-xs sm:text-sm">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-sm"
                        min={startDate || undefined}
                      />
                    </div>
                  </div>
                  
                  {hasDateFilter && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        {startDate && endDate && (
                          <span>
                            Showing bets from {new Date(startDate).toLocaleDateString('en-IN')} to {new Date(endDate).toLocaleDateString('en-IN')}
                          </span>
                        )}
                        {startDate && !endDate && (
                          <span>Showing bets from {new Date(startDate).toLocaleDateString('en-IN')} onwards</span>
                        )}
                        {!startDate && endDate && (
                          <span>Showing bets until {new Date(endDate).toLocaleDateString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="w-full sm:w-auto grid grid-cols-2">
            <TabsTrigger value="sports" className="text-xs sm:text-sm">
              <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Sports </span>Bets
            </TabsTrigger>
            <TabsTrigger value="casino" className="text-xs sm:text-sm">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Casino </span>Bets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sports" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Sports Bets</CardTitle>
                {hasDateFilter && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {sportsBets?.length || 0} bet{sportsBets?.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {sportsBetsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 sm:h-24 w-full" />
                    <Skeleton className="h-20 sm:h-24 w-full" />
                    <Skeleton className="h-20 sm:h-24 w-full" />
                  </div>
                ) : sportsBets && sportsBets.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {sportsBets.map((bet) => (
                      <div key={bet.id} className="p-3 sm:p-4 border rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm sm:text-base truncate">{bet.selection}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              {bet.sport} • {bet.market_type || 'Market'}
                            </div>
                          </div>
                          <Badge
                            variant={
                              bet.status === 'WON'
                                ? 'default'
                                : bet.status === 'LOST'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs w-fit"
                          >
                            {bet.status || 'OPEN'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm mt-2">
                          <div>
                            <span className="text-muted-foreground">Stake: </span>
                            <span className="font-medium">₹{Number(bet.stake).toLocaleString('en-IN')}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rate: </span>
                            <span className="font-medium">{bet.rate || bet.odds}</span>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <span className="text-muted-foreground">Potential: </span>
                            <span className="font-medium">₹{Number(bet.profit || bet.potential_win || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(bet.created_at).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
                    {hasDateFilter ? 'No sports bets found for selected date range' : 'No sports bets found'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="casino" className="space-y-3 sm:space-y-4">
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="text-lg sm:text-xl">Casino Bets</CardTitle>
                {hasDateFilter && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {casinoBets?.length || 0} bet{casinoBets?.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {casinoBetsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-20 sm:h-24 w-full" />
                    <Skeleton className="h-20 sm:h-24 w-full" />
                    <Skeleton className="h-20 sm:h-24 w-full" />
                  </div>
                ) : casinoBets && casinoBets.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {casinoBets.map((bet: any, index: number) => (
                      <div key={bet.id || index} className="p-3 sm:p-4 border rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm sm:text-base">{bet.game_type || 'Casino'}</div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              {bet.bet_type || bet.color || bet.side || 'Bet'}
                            </div>
                          </div>
                          <Badge
                            variant={
                              bet.status === 'won' || bet.status === 'WON'
                                ? 'default'
                                : bet.status === 'lost' || bet.status === 'LOST'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs w-fit"
                          >
                            {bet.status || 'PENDING'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm mt-2">
                          <div>
                            <span className="text-muted-foreground">Amount: </span>
                            <span className="font-medium">
                              ₹{Number(bet.bet_amount || bet.stake || bet.amount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                          {bet.payout_amount && (
                            <div>
                              <span className="text-muted-foreground">Payout: </span>
                              <span className="font-medium">₹{Number(bet.payout_amount).toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(bet.created_at).toLocaleString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground text-sm sm:text-base">
                    {hasDateFilter ? 'No casino bets found for selected date range' : 'No casino bets found'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BettingHistory;
