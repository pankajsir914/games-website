
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { LudoGameControl } from '@/components/admin/game-controls/LudoGameControl';
import { AviatorGameControl } from '@/components/admin/game-controls/AviatorGameControl';
import { ColorPredictionGameControl } from '@/components/admin/game-controls/ColorPredictionGameControl';
import { CasinoGameControl } from '@/components/admin/game-controls/CasinoGameControl';
import { RummyGameControl } from '@/components/admin/game-controls/RummyGameControl';
import { AndarBaharGameControl } from '@/components/admin/game-controls/AndarBaharGameControl';
import { RouletteGameControl } from '@/components/admin/game-controls/RouletteGameControl';
import { PokerGameControl } from '@/components/admin/game-controls/PokerGameControl';
import { JackpotGameControl } from '@/components/admin/game-controls/JackpotGameControl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, BarChart3, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type GameType = 'ludo' | 'aviator' | 'color_prediction' | 'casino' | 'rummy' | 'andar_bahar' | 'roulette' | 'poker' | 'jackpot';

const AdminGameDashboard = () => {
  const { gameType } = useParams<{ gameType: GameType }>();
  const navigate = useNavigate();

  const gameConfig = {
    ludo: {
      title: 'Ludo Game Control',
      description: 'Manage Ludo games, control dice rolls, and manipulate game outcomes',
      icon: '🎲'
    },
    aviator: {
      title: 'Aviator Game Control',
      description: 'Control crash multipliers, timing, and betting outcomes',
      icon: '✈️'
    },
    color_prediction: {
      title: 'Color Prediction Control',
      description: 'Manipulate color outcomes and betting results',
      icon: '🎨'
    },
    casino: {
      title: 'Casino Games Control',
      description: 'Control Teen Patti and other general casino games',
      icon: '🎰'
    },
    rummy: {
      title: 'Rummy Game Control',
      description: 'Control card distribution, sequences, and game outcomes',
      icon: '🎴'
    },
    andar_bahar: {
      title: 'Andar Bahar Control',
      description: 'Manipulate joker cards and winning side outcomes',
      icon: '♠️'
    },
    roulette: {
      title: 'Roulette Game Control',
      description: 'Control wheel spins, numbers, and color outcomes',
      icon: '🎯'
    },
    poker: {
      title: 'Poker Game Control',
      description: 'Manage tables, control hands, and manipulate outcomes',
      icon: '🃏'
    },
    jackpot: {
      title: 'Jackpot Game Control',
      description: 'Control winners, ticket draws, and jackpot outcomes',
      icon: '🏆'
    }
  };

  const renderGameControl = () => {
    switch (gameType) {
      case 'ludo':
        return <LudoGameControl />;
      case 'aviator':
        return <AviatorGameControl />;
      case 'color_prediction':
        return <ColorPredictionGameControl />;
      case 'casino':
        return <CasinoGameControl />;
      case 'rummy':
        return <RummyGameControl />;
      case 'andar_bahar':
        return <AndarBaharGameControl />;
      case 'roulette':
        return <RouletteGameControl />;
      case 'poker':
        return <PokerGameControl />;
      case 'jackpot':
        return <JackpotGameControl />;
      default:
        return (
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Game type not found</p>
            </CardContent>
          </Card>
        );
    }
  };

  const currentGame = gameType ? gameConfig[gameType] : null;

  if (!currentGame) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive">Game Not Found</h1>
          <Button onClick={() => navigate('/admin/games')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/games')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <span className="text-2xl">{currentGame.icon}</span>
                {currentGame.title}
              </h1>
              <p className="text-muted-foreground">{currentGame.description}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </Button>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Active Players
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {renderGameControl()}
      </div>
    </AdminLayout>
  );
};

export default AdminGameDashboard;
