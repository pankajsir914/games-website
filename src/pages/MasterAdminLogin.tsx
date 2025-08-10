import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Crown, Shield, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMasterAdminAuth } from '@/hooks/useMasterAdminAuth';

const MasterAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { signIn, loading } = useMasterAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      navigate('/master-admin');
    } catch (error) {
      // Error handling is done in the hook
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-background border-gaming-gold/20 focus:border-gaming-gold"
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
                    placeholder="Enter your password"
                    className="bg-background border-gaming-gold/20 focus:border-gaming-gold pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
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

        {/* Security Features */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              256-bit Encryption
            </div>
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Secure Session
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Activity Logged
            </div>
          </div>
        </div>

        {/* Setup Instructions */}
        <Card className="mt-6 bg-gaming-accent/10 border-gaming-accent/20">
          <CardContent className="pt-6">
            <div className="text-center text-xs text-muted-foreground">
              Ensure your Supabase user has the master_admin role. If setting up the first time, run setup_master_admin(email) on your DB.
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            You must be signed into Supabase as a master_admin to access this panel
          </p>
        </div>
      </div>
    </div>
  );
};

export default MasterAdminLogin;