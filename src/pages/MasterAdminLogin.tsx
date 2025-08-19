import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Crown, Shield, Lock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMasterAdminAuth } from '@/hooks/useMasterAdminAuth';
import { toast } from 'sonner';

const MasterAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signIn, loading, user, isMasterAdmin } = useMasterAdminAuth();

  // Redirect if already authenticated as master admin
  useEffect(() => {
    if (user && isMasterAdmin && !loading) {
      navigate('/master-admin', { replace: true });
    }
  }, [user, isMasterAdmin, loading, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await signIn(email, password);
      toast.success('Successfully signed in as Master Admin');
      navigate('/master-admin', { replace: true });
    } catch (error: any) {
      const errorMessage = error.message || 'Authentication failed. Please check your credentials.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-full mb-4">
            <Crown className="h-8 w-8 text-gaming-gold-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Master Admin
          </h1>
          <p className="text-muted-foreground mt-2">
            Secure access to ultimate system control
          </p>
        </div>

        {/* Security Warning */}
        <Card className="bg-gaming-danger/10 border-gaming-danger/20 mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gaming-danger" />
              <div>
                <p className="text-sm font-medium text-gaming-danger">Restricted Access</p>
                <p className="text-xs text-muted-foreground">
                  This panel is for authorized Master Administrators only
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card className="bg-gradient-card border-gaming-gold/20">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Lock className="h-5 w-5 text-gaming-gold" />
              Secure Login
            </CardTitle>
            <CardDescription>
              Enter your secure master admin credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-gaming-danger/10 border border-gaming-danger/20 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gaming-danger" />
                  <p className="text-sm text-gaming-danger">{error}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="masteradmin@example.com"
                  className="bg-background border-gaming-gold/20 focus:border-gaming-gold"
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your secure password"
                    className="bg-background border-gaming-gold/20 focus:border-gaming-gold pr-10"
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90 h-12 text-lg font-semibold"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gaming-gold-foreground"></div>
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Access Master Panel
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>


        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by Supabase Auth | Secured with Rate Limiting
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Test Credentials: masteradmin@example.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default MasterAdminLogin;