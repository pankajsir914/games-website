import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface LudoAuthProps {
  onLogin: (username: string, password: string) => Promise<void>;
  loading: boolean;
}

export const LudoAuth: React.FC<LudoAuthProps> = ({ onLogin, loading }) => {
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('Test@123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(username, password);
  };

  return (
    <Card className="bg-white/10 backdrop-blur border-white/20">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Login to Play</CardTitle>
        <CardDescription className="text-gray-300">
          Enter your credentials to start playing Ludo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              placeholder="Enter username"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              placeholder="Enter password"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </Button>
        </form>

        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-200 text-sm">
            <strong>Demo Account:</strong><br />
            Username: testuser<br />
            Password: Test@123<br />
            Starting balance: 1000 tokens
          </p>
        </div>
      </CardContent>
    </Card>
  );
};