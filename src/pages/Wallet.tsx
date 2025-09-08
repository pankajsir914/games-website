
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

const Wallet = () => {
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [withdrawMoneyOpen, setWithdrawMoneyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      {/* Mobile Sticky Header with Balance */}
      <div className="lg:hidden sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="px-4 py-3">
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

        {/* Mobile View with Tabs */}
        <div className="lg:hidden">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="overview" className="text-xs">
                <Wallet2 className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs">
                <History className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
              <TabsTrigger value="methods" className="text-xs">
                <CreditCard className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Methods</span>
              </TabsTrigger>
              <TabsTrigger value="requests" className="text-xs">
                <Receipt className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Requests</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Quick Actions - Mobile Optimized */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => setAddMoneyOpen(true)}
                      className="h-20 flex flex-col gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                    >
                      <div className="bg-white/20 rounded-full p-2">
                        <ArrowDownRight className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold">Add Points</span>
                    </Button>
                    <Button 
                      onClick={() => setWithdrawMoneyOpen(true)}
                      variant="outline"
                      className="h-20 flex flex-col gap-2 border-2"
                    >
                      <div className="bg-primary/10 rounded-full p-2">
                        <ArrowUpRight className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-semibold">Withdraw</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
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

      {/* Mobile Floating Action Buttons */}
      <div className="lg:hidden fixed bottom-20 right-4 z-50 flex flex-col gap-2">
        <Button
          onClick={() => setWithdrawMoneyOpen(true)}
          size="icon"
          variant="outline"
          className="h-12 w-12 rounded-full shadow-lg bg-background border-2"
        >
          <ArrowUpRight className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => setAddMoneyOpen(true)}
          size="icon"
          className="h-14 w-14 rounded-full shadow-xl"
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
