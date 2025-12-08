
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Mail, Lock, User, Phone, MessageCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AuthModal = ({ open, onOpenChange }: AuthModalProps) => {
  const { signIn, resetPassword, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  // Registration form state
  const DEFAULT_DOMAIN = "@rrbgames.com";
  const [registerName, setRegisterName] = useState('');
  const [registerMobile, setRegisterMobile] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!registerName.trim() || !registerMobile.trim() || !registerEmail.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(registerName)) {
      toast.error('Name should only contain letters');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(registerMobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsRegistering(true);

    // Create WhatsApp message
    const message = `I want an ID\n\nName: ${registerName}\nMobile: ${registerMobile}\nEmail: ${registerEmail}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/919876543210?text=${encodedMessage}`;
    
    // Open WhatsApp
    window.open(whatsappLink, '_blank');
    
    // Show success toast
    toast.success('Redirecting to WhatsApp...', {
      description: 'Your registration details are ready to send'
    });
    
    // Reset form
    setRegisterName('');
    setRegisterMobile('');
    setRegisterEmail('');
    setIsRegistering(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Games Website</DialogTitle>
          <DialogDescription>
            Sign in to your account or register to get started.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-4">
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Username</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
  id="signin-email"
  type="text"
  placeholder="Enter username"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  onBlur={() => {
    if (email && !email.includes("@")) {
      setEmail(email + DEFAULT_DOMAIN);
    }
  }}
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
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
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
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="pl-10"
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-mobile">Mobile Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-mobile"
                    type="tel"
                    placeholder="9876543210"
                    value={registerMobile}
                    onChange={(e) => setRegisterMobile(e.target.value)}
                    className="pl-10"
                    maxLength={10}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter 10-digit mobile number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="pl-10"
                    maxLength={255}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-[#25D366] hover:bg-[#25D366]/90"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Register & Get ID
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground">
              Your details will be sent via WhatsApp to our support team
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
