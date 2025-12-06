import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Coins } from 'lucide-react';
import { useAdminCredits } from '@/hooks/useAdminCredits';
import { TPINVerificationModal } from '@/components/admin/TPINVerificationModal';

interface PointsCreditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  onComplete?: () => void;
}

export const PointsCreditModal = ({ open, onOpenChange, targetUserId, onComplete }: PointsCreditModalProps) => {
  const { balance, isLoadingBalance, distribute, isDistributing } = useAdminCredits();
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // TPIN verification state
  const [tpinModalOpen, setTpinModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount || '0');
    if (isNaN(value) || value <= 0) return;
    
    // Open TPIN verification modal
    setTpinModalOpen(true);
  };

  const handleTPINVerified = () => {
    const value = parseFloat(amount || '0');
    distribute({ userId: targetUserId, amount: value, notes }, {
      onSuccess: () => {
        setAmount('');
        setNotes('');
        onComplete?.();
        onOpenChange(false);
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Credit Points to User</DialogTitle>
            <DialogDescription>
              Transfer points from your admin balance to the selected user.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Available Admin Points</Label>
              <div className="flex items-center gap-2 text-foreground">
                <Coins className="h-4 w-4 text-gaming-primary" />
                <span className="font-medium">{isLoadingBalance ? 'Loading…' : Math.floor(balance).toLocaleString()} pts</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points to Credit</Label>
              <Input
                id="points"
                type="number"
                min={1}
                step="1"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add a note" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isDistributing || !amount || parseFloat(amount) <= 0}>
                {isDistributing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Credit Points
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      <TPINVerificationModal
        open={tpinModalOpen}
        onOpenChange={setTpinModalOpen}
        onVerified={handleTPINVerified}
        actionDescription={`crediting ${amount} points to user`}
      />
    </>
  );
};