
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Edit, TrendingUp, Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const games = [
  {
    id: 1,
    name: 'Ludo',
    type: 'ludo',
    status: 'active',
    players: 1250,
    revenue: 45680,
    minBet: 10,
    maxBet: 10000,
    commission: 5
  },
  {
    id: 2,
    name: 'Teen Patti',
    type: 'casino',
    status: 'active',
    players: 890,
    revenue: 67420,
    minBet: 50,
    maxBet: 50000,
    commission: 8
  },
  {
    id: 3,
    name: 'Rummy',
    type: 'rummy',
    status: 'active',
    players: 756,
    revenue: 34520,
    minBet: 25,
    maxBet: 25000,
    commission: 6
  },
  {
    id: 4,
    name: 'Aviator',
    type: 'aviator',
    status: 'active',
    players: 2100,
    revenue: 123450,
    minBet: 1,
    maxBet: 100000,
    commission: 3
  },
  {
    id: 5,
    name: 'Color Prediction',
    type: 'color_prediction',
    status: 'active',
    players: 1580,
    revenue: 89230,
    minBet: 5,
    maxBet: 5000,
    commission: 7
  },
  {
    id: 6,
    name: 'Andar Bahar',
    type: 'andar_bahar',
    status: 'active',
    players: 950,
    revenue: 78430,
    minBet: 10,
    maxBet: 25000,
    commission: 6
  },
  {
    id: 7,
    name: 'Roulette',
    type: 'roulette',
    status: 'active',
    players: 720,
    revenue: 56780,
    minBet: 5,
    maxBet: 50000,
    commission: 4
  },
  {
    id: 8,
    name: 'Poker',
    type: 'poker',
    status: 'active',
    players: 640,
    revenue: 92340,
    minBet: 100,
    maxBet: 100000,
    commission: 10
  },
  {
    id: 9,
    name: 'Jackpot',
    type: 'jackpot',
    status: 'active',
    players: 450,
    revenue: 34560,
    minBet: 10,
    maxBet: 1000,
    commission: 15
  }
];

export const GameSettingsCards = () => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-gaming-success">Active</Badge>;
      case 'maintenance':
        return <Badge variant="secondary">Maintenance</Badge>;
      case 'disabled':
        return <Badge variant="destructive">Disabled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleGameDashboard = (gameType: string) => {
    navigate(`/admin/game-dashboard/${gameType}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game) => (
        <Card key={game.id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">{game.name}</CardTitle>
            {getStatusBadge(game.status)}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Active Players</p>
                <p className="font-semibold">{game.players.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Revenue</p>
                <p className="font-semibold text-gaming-success">₹{game.revenue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Min Bet</p>
                <p className="font-semibold">₹{game.minBet}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Max Bet</p>
                <p className="font-semibold">₹{game.maxBet.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Commission: {game.commission}%</span>
              <Switch checked={game.status === 'active'} />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleGameDashboard(game.type)}
              >
                <Gamepad2 className="mr-2 h-4 w-4" />
                Game Dashboard
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
            
            <Button variant="outline" size="sm" className="w-full">
              <TrendingUp className="mr-2 h-4 w-4" />
              Analytics
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
