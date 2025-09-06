
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRoulette } from '@/hooks/useRoulette';
import { useRouletteLive } from '@/hooks/useRouletteLive';
import { useRouletteSounds } from '@/hooks/useRouletteSounds';
import { useGameManagement } from '@/hooks/useGameManagement';
import { useWallet } from '@/hooks/useWallet';
import Navigation from '@/components/Navigation';
import { WalletCard } from '@/components/wallet/WalletCard';
import RouletteWheel3D from '@/components/roulette/RouletteWheel3D';
import PremiumRouletteWheel3D from '@/components/roulette/PremiumRouletteWheel3D';
import { RouletteWheel } from '@/components/roulette/RouletteWheel';
import { BettingGrid } from '@/components/roulette/BettingGrid';
import RouletteBettingTable from '@/components/roulette/RouletteBettingTable';
import ChipSelector from '@/components/roulette/ChipSelector';
import RouletteStatistics from '@/components/roulette/RouletteStatistics';
import { GameTimer } from '@/components/roulette/GameTimer';
import { RouletteHistory } from '@/components/roulette/RouletteHistory';
import { RouletteLeaderboard } from '@/components/roulette/RouletteLeaderboard';
import RouletteLiveBetsPanel from '@/components/roulette/RouletteLiveBetsPanel';
import RoulettePlayerPresence from '@/components/roulette/RoulettePlayerPresence';
import { AuthModal } from '@/components/auth/AuthModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trophy, Clock, DollarSign, Activity, Users, Sparkles, Grid3X3 } from 'lucide-react';
import { BetType, PlacedBet } from '@/types/roulette';
import { toast } from '@/hooks/use-toast';

const Roulette = () => {
  const { user } = useAuth();
  const { isGamePaused } = useGameManagement();
  const { wallet } = useWallet();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [use3DWheel, setUse3DWheel] = useState(true);
  const [useProfessionalTable, setUseProfessionalTable] = useState(true);
  const [selectedChipValue, setSelectedChipValue] = useState(10);
  const [isLocalSpinning, setIsLocalSpinning] = useState(false);
  const {
    currentRound,
    userBets,
    roundHistory,
    userBetHistory,
    timeRemaining,
    roundLoading,
    placeBet,
    isPlacingBet,
    spinWheel,
    isSpinningWheel,
  } = useRoulette();
  
  const {
    liveBets,
    totalPlayers,
    totalBetAmount,
    onlineCount,
    recentPlayers,
    startAutoManagement,
    isAutoManaging
  } = useRouletteLive();
  
  const gameIsPaused = isGamePaused('roulette');
  
  // Start auto-management when component mounts
  useEffect(() => {
    startAutoManagement();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-4">🎰 Roulette</h1>
            <p className="text-xl text-gray-300 mb-8">
              Please sign in to play Roulette
            </p>
            <Button onClick={() => setAuthModalOpen(true)}>
              Sign In
            </Button>
            <AuthModal 
              open={authModalOpen} 
              onOpenChange={setAuthModalOpen} 
            />
          </div>
        </div>
      </div>
    );
  }

  const isBettingOpen = currentRound?.status === 'betting' && timeRemaining > 0 && !gameIsPaused;
  const isWheelSpinning = currentRound?.status === 'spinning' || isSpinningWheel;
  const canSpin = currentRound?.status === 'betting' && timeRemaining <= 0 && userBets.length > 0 && !gameIsPaused;

  const handleSpin = () => {
    if (canSpin && currentRound) {
      setIsLocalSpinning(true);
      spinWheel(currentRound.id);
    }
  };
  
  // Properly manage the spinning state - only use round status for actual wheel spinning
  const isSpinning = currentRound?.status === 'spinning' || isLocalSpinning;
  
  // Reset local spinning state when round completes
  useEffect(() => {
    if (currentRound?.status === 'completed' || currentRound?.status === 'betting') {
      setIsLocalSpinning(false);
    }
  }, [currentRound?.status]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Game Paused Alert */}
        {gameIsPaused && (
          <Alert variant="destructive" className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700 dark:text-red-300 font-medium">
              Roulette game is currently paused for maintenance. Please check back later.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">🎰 European Roulette</h1>
          <p className="text-xl text-gray-300 mb-4">
            Single Zero • European Rules • Place your bets and spin the wheel!
          </p>
          
          {/* Game Stats */}
          <div className="flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Round #{currentRound?.round_number || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Balance: ₹{wallet?.current_balance || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span>Total Bets: ₹{userBets.reduce((sum, bet) => sum + bet.bet_amount, 0)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            <WalletCard />
            
            {roundLoading ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ) : (
              <GameTimer
                timeRemaining={timeRemaining}
                status={currentRound?.status || 'completed'}
                roundNumber={currentRound?.round_number}
              />
            )}
          </div>

          {/* Main Game Area */}
          <div className="xl:col-span-2 space-y-6">
            {/* View Toggle */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="3d-mode"
                      checked={use3DWheel}
                      onCheckedChange={setUse3DWheel}
                    />
                    <Label htmlFor="3d-mode" className="cursor-pointer flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Enhanced 3D View
                    </Label>
                  </div>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Grid3X3 className="w-3 h-3" />
                  European Roulette
                </Badge>
              </div>
            </Card>
            
            {/* Roulette Wheel */}
            <Card>
              <CardContent className="p-8">
                {roundLoading ? (
                  <div className="flex justify-center">
                    <Skeleton className="w-80 h-80 rounded-full" />
                  </div>
                ) : use3DWheel ? (
                  <PremiumRouletteWheel3D
                    isSpinning={isSpinning}
                    winningNumber={currentRound?.winning_number}
                    onSpinComplete={() => setIsLocalSpinning(false)}
                  />
                ) : (
                  <RouletteWheel
                    isSpinning={isSpinning}
                    winningNumber={currentRound?.winning_number}
                    onSpinComplete={() => setIsLocalSpinning(false)}
                  />
                )}
              </CardContent>
            </Card>

            {/* Game Status & Spin Button */}
            {currentRound && (
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="space-y-4">
                    <div className="text-lg font-semibold">
                      Round #{currentRound.round_number}
                    </div>
                    
                    {currentRound.status === 'betting' && timeRemaining > 0 && (
                      <div className="text-green-600 font-medium">
                        🟢 Betting is open! Time remaining: {timeRemaining}s
                      </div>
                    )}
                    
                    {currentRound.status === 'betting' && timeRemaining <= 0 && (
                      <div className="text-orange-600 font-medium">
                        🟡 Betting closed. Ready to spin!
                      </div>
                    )}
                    
                    {(currentRound.status === 'spinning' || isWheelSpinning) && (
                      <div className="text-blue-600 font-medium">
                        🔵 Wheel is spinning... Good luck!
                      </div>
                    )}
                    
                    {currentRound.status === 'completed' && currentRound.winning_number !== undefined && (
                      <div className="text-purple-600 font-medium">
                        🎯 Winning number: {currentRound.winning_number} ({currentRound.winning_color})
                      </div>
                    )}

                    {/* Spin Button */}
                    {canSpin && (
                      <Button
                        onClick={handleSpin}
                        disabled={isSpinningWheel || gameIsPaused}
                        size="lg"
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold text-lg px-8 py-3"
                      >
                        🎰 SPIN THE WHEEL
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel */}
          <div className="xl:col-span-1 space-y-6">
            {/* Live Bets Panel */}
            <RouletteLiveBetsPanel 
              liveBets={liveBets}
              totalPlayers={totalPlayers}
              totalBetAmount={totalBetAmount}
            />
            
            {/* Player Presence */}
            <RoulettePlayerPresence
              onlineCount={onlineCount}
              recentPlayers={recentPlayers}
            />
            
            {/* History and Leaderboard */}
            <Tabs defaultValue="history" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaders</TabsTrigger>
              </TabsList>
              <TabsContent value="history" className="space-y-4">
                <RouletteHistory
                  roundHistory={roundHistory}
                  userBetHistory={userBetHistory}
                />
              </TabsContent>
              <TabsContent value="leaderboard" className="space-y-4">
                <RouletteLeaderboard />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Enhanced Betting Interface */}
        <div className="mt-8 space-y-6">
          {/* Chip Selector */}
          <Card>
            <CardContent className="p-4">
              <ChipSelector
                selectedChip={selectedChipValue}
                onSelectChip={setSelectedChipValue}
                totalBet={userBets.reduce((sum, bet) => sum + bet.bet_amount, 0)}
                onClearBets={() => {}}
                onUndoLast={() => {}}
                onRepeatBet={() => {}}
                onDoubleBet={() => {}}
                canUndo={false}
                canRepeat={false}
                disabled={!isBettingOpen || gameIsPaused}
              />
            </CardContent>
          </Card>

          {/* Betting Table Toggle */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Betting Table</h2>
              <div className="flex items-center space-x-2">
                <Switch
                  id="pro-table"
                  checked={useProfessionalTable}
                  onCheckedChange={setUseProfessionalTable}
                />
                <Label htmlFor="pro-table" className="cursor-pointer">
                  Professional Layout
                </Label>
              </div>
            </div>
          </Card>

          {/* Betting Table */}
          <Card>
            <CardContent className="p-6">
              {useProfessionalTable ? (
                <RouletteBettingTable
                  onPlaceBet={(betType, betValue) => placeBet(betType, betValue, selectedChipValue)}
                  placedBets={userBets.map(bet => ({ 
                    betType: bet.bet_type as BetType, 
                    value: bet.bet_value, 
                    amount: bet.bet_amount,
                    type: bet.bet_type,
                    payout: '0'
                  }))}
                  selectedChip={selectedChipValue}
                  disabled={!isBettingOpen || gameIsPaused}
                />
              ) : (
                <BettingGrid
                  onPlaceBet={placeBet}
                  userBets={userBets}
                  disabled={!isBettingOpen || gameIsPaused}
                  isPlacingBet={isPlacingBet}
                />
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <RouletteStatistics 
            roundHistory={roundHistory}
          />
        </div>
      </div>
    </div>
  );
};

export default Roulette;
