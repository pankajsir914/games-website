import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserCompleteDetails } from '@/hooks/useUserCompleteDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { UserOverviewTab } from './tabs/UserOverviewTab';
import { BettingHistoryTab } from './tabs/BettingHistoryTab';
import { TransactionHistoryTab } from './tabs/TransactionHistoryTab';
import { GameSessionsTab } from './tabs/GameSessionsTab';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UserCompleteDetailsModalProps {
  open: boolean;
  userId: string | null;
  onOpenChange: (open: boolean) => void;
}

export const UserCompleteDetailsModal = ({
  open,
  userId,
  onOpenChange,
}: UserCompleteDetailsModalProps) => {
  const { data, isLoading, error } = useUserCompleteDetails(userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">User Complete Details</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load user details. Please try again.
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="betting" className="text-xs sm:text-sm">Betting</TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transactions</TabsTrigger>
              <TabsTrigger value="sessions" className="text-xs sm:text-sm">Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 sm:mt-6">
              <UserOverviewTab data={data} />
            </TabsContent>

            <TabsContent value="betting" className="mt-4 sm:mt-6">
              <BettingHistoryTab data={data} />
            </TabsContent>

            <TabsContent value="transactions" className="mt-4 sm:mt-6">
              <TransactionHistoryTab data={data} />
            </TabsContent>

            <TabsContent value="sessions" className="mt-4 sm:mt-6">
              <GameSessionsTab data={data} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
