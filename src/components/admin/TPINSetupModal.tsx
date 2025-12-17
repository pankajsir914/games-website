import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Shield, Eye, EyeOff, CheckCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { useTPIN } from '@/hooks/useTPIN';

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What city were you born in?",
  "What was your childhood nickname?",
  "What is the name of your favorite childhood friend?",
  "What was the make of your first car?",
  "What is your favorite movie?",
  "What is the name of your first school?",
];

interface TPINSetupModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  canDismiss?: boolean;
  mode?: 'setup' | 'change';
}

export const TPINSetupModal = ({ open, onOpenChange, canDismiss = false, mode = 'setup' }: TPINSetupModalProps) => {
  const { 
    setTPIN, 
    verifyTPIN, 
    verifySecurityAnswer,
    isSettingTPIN, 
    isVerifyingTPIN, 
    isVerifyingSecurityAnswer,
    hasTPIN,
    hasSecurityQuestion,
    securityQuestionText
  } = useTPIN();
  
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [tpin, setTpin] = useState('');
  const [confirmTpin, setConfirmTpin] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState('');
  const [newSecurityAnswer, setNewSecurityAnswer] = useState('');
  const [showTpin, setShowTpin] = useState(false);
  const [showConfirmTpin, setShowConfirmTpin] = useState(false);
  const [error, setError] = useState('');
  
  // Steps: 'security_verify' -> 'new_tpin' -> 'new_security' (for change mode with security question)
  // Steps: 'new_tpin' -> 'new_security' (for setup mode)
  const [step, setStep] = useState<'security_verify' | 'new_tpin' | 'new_security'>('new_tpin');

  const isChanging = mode === 'change';
  const isLoading = isSettingTPIN || isVerifyingTPIN || isVerifyingSecurityAnswer;

  useEffect(() => {
    if (open) {
      // Determine initial step based on mode and security question presence
      if (isChanging && hasSecurityQuestion) {
        setStep('security_verify');
      } else {
        setStep('new_tpin');
      }
    }
  }, [open, isChanging, hasSecurityQuestion]);

  const resetForm = () => {
    setSecurityAnswer('');
    setTpin('');
    setConfirmTpin('');
    setSelectedQuestion('');
    setNewSecurityAnswer('');
    setError('');
    if (isChanging && hasSecurityQuestion) {
      setStep('security_verify');
    } else {
      setStep('new_tpin');
    }
  };

  const handleVerifySecurityAnswer = async () => {
    setError('');
    
    if (!securityAnswer.trim()) {
      setError('Please enter your security answer');
      return;
    }

    try {
      const result = await verifySecurityAnswer(securityAnswer);
      if (result.success) {
        setStep('new_tpin');
        setSecurityAnswer('');
      } else {
        setError(result.error || 'Incorrect answer');
      }
    } catch (err) {
      setError('Failed to verify security answer');
    }
  };

  const handleTPINSubmit = () => {
    setError('');

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

    // Move to security question step for new setup
    if (!isChanging || !hasSecurityQuestion) {
      setStep('new_security');
    } else {
      // For change mode with existing security question, just update TPIN
      submitTPIN();
    }
  };

  const submitTPIN = () => {
    setError('');

    // Validate security question for new setup
    if (step === 'new_security') {
      if (!selectedQuestion) {
        setError('Please select a security question');
        return;
      }
      if (!newSecurityAnswer.trim()) {
        setError('Please enter a security answer');
        return;
      }
      if (newSecurityAnswer.trim().length < 3) {
        setError('Security answer must be at least 3 characters');
        return;
      }
    }

    setTPIN({
      tpin,
      securityQuestion: step === 'new_security' ? selectedQuestion : undefined,
      securityAnswer: step === 'new_security' ? newSecurityAnswer : undefined
    }, {
      onSuccess: () => {
        resetForm();
        if (canDismiss && onOpenChange) {
          onOpenChange(false);
        }
      },
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !canDismiss) {
      return;
    }
    if (!newOpen) {
      resetForm();
    }
    onOpenChange?.(newOpen);
  };

  const getStepDescription = () => {
    if (step === 'security_verify') {
      return 'Answer your security question to verify your identity.';
    }
    if (step === 'new_tpin') {
      return isChanging 
        ? 'Create a new 4-6 digit Transaction PIN.'
        : 'Create a 4-6 digit Transaction PIN (TPIN) to secure sensitive admin actions.';
    }
    return 'Set up a security question to help recover your TPIN if needed.';
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
            {step === 'security_verify' || step === 'new_security' 
              ? <HelpCircle className="h-6 w-6 text-primary" />
              : isChanging 
                ? <RefreshCw className="h-6 w-6 text-primary" /> 
                : <Shield className="h-6 w-6 text-primary" />
            }
          </div>
          <DialogTitle>
            {step === 'security_verify' && 'Security Verification'}
            {step === 'new_tpin' && (isChanging ? 'Change Your TPIN' : 'Set Up Your TPIN')}
            {step === 'new_security' && 'Set Security Question'}
          </DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
        </DialogHeader>

        {/* Step 1: Security Question Verification (for change mode) */}
        {step === 'security_verify' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Security Question</Label>
              <p className="text-sm p-3 bg-muted rounded-lg">{securityQuestionText}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="securityAnswer">Your Answer</Label>
              <Input
                id="securityAnswer"
                type="text"
                placeholder="Enter your answer"
                value={securityAnswer}
                onChange={(e) => {
                  setSecurityAnswer(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button 
              type="button" 
              className="w-full" 
              disabled={isLoading || !securityAnswer.trim()}
              onClick={handleVerifySecurityAnswer}
            >
              {isVerifyingSecurityAnswer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Continue
            </Button>
          </div>
        )}

        {/* Step 2: New TPIN Entry */}
        {step === 'new_tpin' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="tpin">{isChanging ? 'New TPIN (4-6 digits)' : 'Create TPIN (4-6 digits)'}</Label>
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
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowTpin(!showTpin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmTpin(!showConfirmTpin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
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
            </div>

            <Button 
              type="button" 
              className="w-full" 
              disabled={isLoading || tpin.length < 4}
              onClick={handleTPINSubmit}
            >
              {isChanging && hasSecurityQuestion ? 'Update TPIN' : 'Continue'}
            </Button>
          </div>
        )}

        {/* Step 3: Security Question Setup (for new setup) */}
        {step === 'new_security' && (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Security Question</Label>
              <Select value={selectedQuestion} onValueChange={setSelectedQuestion}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a security question" />
                </SelectTrigger>
                <SelectContent>
                  {SECURITY_QUESTIONS.map((q, i) => (
                    <SelectItem key={i} value={q}>{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newSecurityAnswer">Your Answer</Label>
              <Input
                id="newSecurityAnswer"
                type="text"
                placeholder="Enter your answer"
                value={newSecurityAnswer}
                onChange={(e) => {
                  setNewSecurityAnswer(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Remember this answer! You'll need it to change your TPIN later.
              </p>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Security question protects your TPIN
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Answer is case-insensitive
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                className="flex-1" 
                onClick={() => setStep('new_tpin')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                type="button" 
                className="flex-1" 
                disabled={isLoading || !selectedQuestion || !newSecurityAnswer.trim()}
                onClick={submitTPIN}
              >
                {isSettingTPIN && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isChanging ? 'Update TPIN' : 'Set TPIN'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};