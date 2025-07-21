
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { WalletCard } from '@/components/wallet/WalletCard';
import { TransactionHistory } from '@/components/wallet/TransactionHistory';
import { AddMoneyModal } from '@/components/wallet/AddMoneyModal';
import { WithdrawMoneyModal } from '@/components/wallet/WithdrawMoneyModal';
import { PaymentRequestsCard } from '@/components/wallet/PaymentRequestsCard';
import { WithdrawalRequestsCard } from '@/components/wallet/WithdrawalRequestsCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus, History, CreditCard, Banknote } from 'lucide-react';

const Wallet = () => {
  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [withdrawMoneyOpen, setWithdrawMoneyOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Wallet</h1>
          <p className="text-muted-foreground">
            Manage your balance, add money, withdraw funds, and view transaction history
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Wallet Info */}
          <div className="lg:col-span-2 space-y-6">
            <WalletCard />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => setAddMoneyOpen(true)}
                    className="h-16 flex flex-col gap-2"
                  >
                    <Plus className="h-6 w-6" />
                    Add Money
                  </Button>
                  <Button 
                    onClick={() => setWithdrawMoneyOpen(true)}
                    variant="outline"
                    className="h-16 flex flex-col gap-2"
                  >
                    <Minus className="h-6 w-6" />
                    Withdraw
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Exchange Rate Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Exchange Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-2xl font-bold text-primary">₹1 = 1 Point</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    All transactions are processed at this fixed rate
                  </p>
                </div>
              </CardContent>
            </Card>

            <TransactionHistory />
          </div>

          {/* Right Column - Requests */}
          <div className="space-y-6">
            <PaymentRequestsCard />
            <WithdrawalRequestsCard />
          </div>
        </div>
      </div>

      <AddMoneyModal open={addMoneyOpen} onOpenChange={setAddMoneyOpen} />
      <WithdrawMoneyModal open={withdrawMoneyOpen} onOpenChange={setWithdrawMoneyOpen} />
    </div>
  );
};

export default Wallet;
