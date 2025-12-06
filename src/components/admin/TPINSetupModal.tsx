import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useTPIN } from '@/hooks/useTPIN';

interface TPINSetupModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  canDismiss?: boolean;
}

export const TPINSetupModal = ({ open, onOpenChange, canDismiss = false }: TPINSetupModalProps) => {
  const { setTPIN, isSettingTPIN } = useTPIN();
  const [tpin, setTpin] = useState('');
  const [confirmTpin, setConfirmTpin] = useState('');
  const [showTpin, setShowTpin] = useState(false);
  const [showConfirmTpin, setShowConfirmTpin] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (tpin.length < 4 || tpin.length > 6) {
      setError('TPIN must be 4-6 digits');
      return;
    }

    if (!/^\d+$/.test(tpin)) {
      setError('TPIN must contain only numbers');
      return;
    }

    if (tpin !== confirmTpin) {
      setError('TPINs do not match');
      return;
    }

    setTPIN(tpin, {
      onSuccess: () => {
        setTpin('');
        setConfirmTpin('');
        if (canDismiss && onOpenChange) {
          onOpenChange(false);
        }
      },
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !canDismiss) {
      return; // Prevent closing if can't dismiss
    }
    onOpenChange?.(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-[420px]"
        onInteractOutside={(e) => {
          if (!canDismiss) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (!canDismiss) e.preventDefault();
        }}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Set Up Your TPIN</DialogTitle>
          <DialogDescription>
            Create a 4-6 digit Transaction PIN (TPIN) to secure sensitive admin actions like approving withdrawals and credits.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="tpin">Create TPIN (4-6 digits)</Label>
            <div className="relative">
              <Input
                id="tpin"
                type={showTpin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter 4-6 digit PIN"
                value={tpin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setTpin(value);
                  setError('');
                }}
                className="pr-10 text-center text-lg tracking-widest"
                disabled={isSettingTPIN}
              />
              <button
                type="button"
                onClick={() => setShowTpin(!showTpin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isSettingTPIN}
              >
                {showTpin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmTpin">Confirm TPIN</Label>
            <div className="relative">
              <Input
                id="confirmTpin"
                type={showConfirmTpin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Re-enter your PIN"
                value={confirmTpin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setConfirmTpin(value);
                  setError('');
                }}
                className="pr-10 text-center text-lg tracking-widest"
                disabled={isSettingTPIN}
              />
              <button
                type="button"
                onClick={() => setShowConfirmTpin(!showConfirmTpin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                disabled={isSettingTPIN}
              >
                {showConfirmTpin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              TPIN is encrypted and stored securely
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Required for all sensitive admin actions
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              5 failed attempts = 15 minute lockout
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isSettingTPIN}>
            {isSettingTPIN && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set TPIN
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};