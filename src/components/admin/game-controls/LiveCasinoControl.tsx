import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, TrendingUp, DollarSign, Activity } from "lucide-react";

export const LiveCasinoControl = () => {
  // Fetch all bets
  const { data: bets, isLoading } = useQuery({
    queryKey: ['diamond-casino-bets-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diamond_casino_bets')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    refetchInterval: 5000
  });

  // Calculate stats
  const stats = {
    totalBets: bets?.length || 0,
    pendingBets: bets?.filter(b => b.status === 'pending').length || 0,
    totalWagered: bets?.reduce((sum, b) => sum + Number(b.bet_amount), 0) || 0,
    totalPayouts: bets?.reduce((sum, b) => 
      b.status === 'won' && b.payout_amount 
        ? sum + Number(b.payout_amount) 
        : sum, 0
    ) || 0,
  };

  const profit = stats.totalWagered - stats.totalPayouts;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Total Bets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Wagered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalWagered.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Profit/Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{profit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Casino Bets</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="won">Won</TabsTrigger>
              <TabsTrigger value="lost">Lost</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <BetsList bets={bets || []} isLoading={isLoading} />
            </TabsContent>

            <TabsContent value="pending" className="mt-4">
              <BetsList 
                bets={bets?.filter(b => b.status === 'pending') || []} 
                isLoading={isLoading} 
              />
            </TabsContent>

            <TabsContent value="won" className="mt-4">
              <BetsList 
                bets={bets?.filter(b => b.status === 'won') || []} 
                isLoading={isLoading} 
              />
            </TabsContent>

            <TabsContent value="lost" className="mt-4">
              <BetsList 
                bets={bets?.filter(b => b.status === 'lost') || []} 
                isLoading={isLoading} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const BetsList = ({ bets, isLoading }: { bets: any[]; isLoading: boolean }) => {
  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  if (bets.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No bets found</div>;
  }

  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-2">
        {bets.map((bet) => (
          <div
            key={bet.id}
            className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
          >
            <div className="space-y-1">
              <div className="font-semibold">{bet.profiles?.full_name || 'Unknown'}</div>
              <div className="text-sm text-muted-foreground">
                {bet.table_name} • {bet.bet_type} • {bet.odds}x
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(bet.created_at).toLocaleString()}
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="font-bold">₹{Number(bet.bet_amount).toFixed(2)}</div>
              {bet.payout_amount && (
                <div className="text-sm text-green-600">
                  +₹{Number(bet.payout_amount).toFixed(2)}
                </div>
              )}
              <Badge variant={
                bet.status === 'won' ? 'default' :
                bet.status === 'lost' ? 'destructive' :
                'secondary'
              }>
                {bet.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
