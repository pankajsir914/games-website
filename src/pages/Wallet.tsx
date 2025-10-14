
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { WalletCard } from '@/components/wallet/WalletCard';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { AddMoneyModal } from '@/components/wallet/AddMoneyModal';
import { WithdrawMoneyModal } from '@/components/wallet/WithdrawMoneyModal';
import { PaymentRequestsCard } from '@/components/wallet/PaymentRequestsCard';
import { WithdrawalRequestsCard } from '@/components/wallet/WithdrawalRequestsCard';
import { PaymentMethodsCard } from '@/components/wallet/PaymentMethodsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, History, CreditCard, Banknote, ArrowUpRight, ArrowDownRight, Receipt, Wallet2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const Wallet = () => {
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [withdrawMoneyOpen, setWithdrawMoneyOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      {/* Mobile Sticky Header with Balance - Dynamic positioning */}
      <div className="lg:hidden sticky top-14 sm:top-16 z-40 bg-background/98 backdrop-blur-md border-b shadow-sm">
        <div className="px-3 sm:px-4 py-3">
          <WalletCard variant="compact" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Wallet</h1>
          <p className="text-muted-foreground">
            Manage your balance, add money, withdraw funds, and view transaction history
          </p>
        </div>

        {/* Mobile View with Tabs - Enhanced touch targets */}
        <div className="lg:hidden">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 h-auto p-1">
              <TabsTrigger 
                value="overview" 
                className="min-h-[44px] text-xs sm:text-sm px-2 py-2 flex-col sm:flex-row gap-0.5 sm:gap-1 data-[state=active]:bg-primary/10"
              >
                <Wallet2 className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-sm">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                className="min-h-[44px] text-xs sm:text-sm px-2 py-2 flex-col sm:flex-row gap-0.5 sm:gap-1 data-[state=active]:bg-primary/10"
              >
                <History className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-sm">History</span>
              </TabsTrigger>
              <TabsTrigger 
                value="methods" 
                className="min-h-[44px] text-xs sm:text-sm px-2 py-2 flex-col sm:flex-row gap-0.5 sm:gap-1 data-[state=active]:bg-primary/10"
              >
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-sm">Methods</span>
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                className="min-h-[44px] text-xs sm:text-sm px-2 py-2 flex-col sm:flex-row gap-0.5 sm:gap-1 data-[state=active]:bg-primary/10"
              >
                <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-sm">Requests</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Quick Actions - Compact & Polished */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
                <CardContent className="p-2.5 sm:p-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <Button 
                      onClick={() => setAddMoneyOpen(true)}
                      className="h-16 sm:h-18 flex flex-col gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md active:scale-95 transition-all rounded-xl"
                    >
                      <div className="bg-white/20 rounded-full p-1.5">
                        <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold">Add Points</span>
                    </Button>
                    <Button 
                      onClick={() => setWithdrawMoneyOpen(true)}
                      variant="outline"
                      className="h-16 sm:h-18 flex flex-col gap-1.5 border-2 hover:bg-muted/50 active:scale-95 transition-all rounded-xl"
                    >
                      <div className="bg-primary/10 rounded-full p-1.5">
                        <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold">Withdraw</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Summary */}
              <Card>
                <CardHeader className="pb-3 px-3 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <TransactionHistory limit={3} compact />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="mt-4">
              <TransactionHistory />
            </TabsContent>

            <TabsContent value="methods" className="mt-4">
              <PaymentMethodsCard />
            </TabsContent>

            <TabsContent value="requests" className="space-y-4 mt-4">
              <PaymentRequestsCard />
              <WithdrawalRequestsCard />
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop View - Enhanced Grid */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column - Main Wallet Info */}
          <div className="lg:col-span-2 space-y-6">
            <WalletCard />
            
            {/* Quick Actions - Desktop */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => setAddMoneyOpen(true)}
                    className="h-20 flex flex-col gap-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg group"
                  >
                    <div className="bg-white/20 rounded-full p-3 group-hover:scale-110 transition-transform">
                      <ArrowDownRight className="h-6 w-6" />
                    </div>
                    <span className="font-semibold">Add Points</span>
                  </Button>
                  <Button 
                    onClick={() => setWithdrawMoneyOpen(true)}
                    variant="outline"
                    className="h-20 flex flex-col gap-3 border-2 group"
                  >
                    <div className="bg-primary/10 rounded-full p-3 group-hover:scale-110 transition-transform">
                      <ArrowUpRight className="h-6 w-6" />
                    </div>
                    <span className="font-semibold">Withdraw</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <PaymentMethodsCard />
            <TransactionHistory />
          </div>

          {/* Right Column - Requests */}
          <div className="space-y-6">
            <PaymentRequestsCard />
            <WithdrawalRequestsCard />
          </div>
        </div>
      </div>

      {/* Mobile Floating Action Buttons - Enhanced with animations */}
      <div className="lg:hidden fixed bottom-24 right-4 z-50 flex flex-col gap-3">
        <Button
          onClick={() => setWithdrawMoneyOpen(true)}
          size="icon"
          variant="outline"
          className="h-12 w-12 rounded-full shadow-lg bg-background/95 backdrop-blur-sm border-2 hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200"
          aria-label="Withdraw money"
        >
          <ArrowUpRight className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => setAddMoneyOpen(true)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-2xl hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200"
          aria-label="Add money"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      <AddMoneyModal open={addMoneyOpen} onOpenChange={setAddMoneyOpen} />
      <WithdrawMoneyModal open={withdrawMoneyOpen} onOpenChange={setWithdrawMoneyOpen} />
    </div>
  );
};

export default Wallet;
