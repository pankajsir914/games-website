import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useAdminCredits } from '@/hooks/useAdminCredits';

export const AdminWalletCard = () => {
  const { balance, isLoadingBalance } = useAdminCredits();

  return (
    <Card className="bg-gradient-to-br from-gaming-primary/10 to-gaming-secondary/10 border-gaming-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Admin Wallet</CardTitle>
        <Wallet className="h-4 w-4 text-gaming-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {isLoadingBalance ? (
            <div className="animate-pulse h-8 w-24 bg-muted rounded"></div>
          ) : (
            `₹${balance.toLocaleString()}`
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Available points for distribution
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <Badge variant="outline" className="text-gaming-success border-gaming-success">
            <TrendingUp className="w-3 h-3 mr-1" />
            Active
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};