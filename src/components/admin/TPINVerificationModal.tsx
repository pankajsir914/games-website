import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useTPIN } from '@/hooks/useTPIN';

interface TPINVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: () => void;
  actionDescription?: string;
}

export const TPINVerificationModal = ({ 
  open, 
  onOpenChange, 
  onVerified,
  actionDescription = 'this action'
}: TPINVerificationModalProps) => {
  const { verifyTPIN, isVerifyingTPIN } = useTPIN();
  const [tpin, setTpin] = useState('');
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMinutes, setLockMinutes] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTpin('');
      setError('');
      setRemainingAttempts(null);
      setIsLocked(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (tpin.length < 4) {
      setError('Please enter your complete TPIN');
      return;
    }

    try {
      const result = await verifyTPIN(tpin);
      
      if (result.success) {
        setTpin('');
        onOpenChange(false);
        onVerified();
      } else {
        setTpin('');
        setError(result.error || 'Invalid TPIN');
        
        if (result.locked) {
          setIsLocked(true);
          setLockMinutes(result.remaining_minutes || 15);
        } else if (result.remaining_attempts !== undefined) {
          setRemainingAttempts(result.remaining_attempts);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setTpin('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setTpin(value);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Enter TPIN</DialogTitle>
          <DialogDescription>
            Enter your Transaction PIN to authorize {actionDescription}
          </DialogDescription>
        </DialogHeader>

        {isLocked ? (
          <div className="text-center py-6">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium">Account Temporarily Locked</p>
            <p className="text-sm text-muted-foreground mt-2">
              Too many failed attempts. Try again in {lockMinutes} minutes.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={tpin}
                  onChange={handleInputChange}
                  className="text-center text-2xl tracking-[0.5em] h-14 font-mono"
                  disabled={isVerifyingTPIN}
                  autoComplete="off"
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-center">
                <p className="text-sm text-destructive">{error}</p>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <p className="text-xs text-destructive/80 mt-1">
                    {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isVerifyingTPIN}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={isVerifyingTPIN || tpin.length < 4}
              >
                {isVerifyingTPIN && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};