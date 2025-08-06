
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Mail, Lock, User, Phone } from 'lucide-react';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const { signIn, resetPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      onOpenChange(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      // Error handled by useAuth hook
    }
  };


  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await resetPassword(resetEmail);
      setResetEmail('');
    } catch (error) {
      // Error handled by useAuth hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Games Website</DialogTitle>
          <DialogDescription>
            Sign in to your account to start playing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="signin-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="signin-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        <div className="space-y-2">
          <Label htmlFor="reset-email">Forgot Password?</Label>
          <form onSubmit={handlePasswordReset} className="flex gap-2">
            <Input
              id="reset-email"
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
            <Button type="submit" variant="outline" disabled={loading}>
              Reset
            </Button>
          </form>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Account creation is restricted to administrators only.
            <br />
            Contact your administrator if you need access.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
