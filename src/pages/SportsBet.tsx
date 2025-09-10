import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useDiamondSportsAPI } from '@/hooks/useDiamondSportsAPI';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import LiveTVSection from '@/components/sports/LiveTVSection';
import EnhancedOddsDisplay from '@/components/sports/EnhancedOddsDisplay';

const SportsBet: React.FC = () => {
  const { sport, matchId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const { callAPI } = useDiamondSportsAPI();
  const { wallet } = useWallet();
  const { toast } = useToast();
  
  const [match, setMatch] = useState<any>(state?.match || null);
  const [odds, setOdds] = useState<any>(null);
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [betAmount, setBetAmount] = useState<string>('');
  const [isLoadingOdds, setIsLoadingOdds] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  // Fetch odds from Diamond API
  useEffect(() => {
    const fetchOdds = async () => {
      if (!matchId || matchId === 'undefined') {
        console.error('Invalid match ID:', matchId);
        toast({
          title: "Error",
          description: "Invalid match ID. Please select a valid match.",
          variant: "destructive"
        });
        return;
      }
      
      setIsLoadingOdds(true);
      try {
        console.log('Fetching odds for match:', matchId);
        
        // Try multiple endpoints to get odds
        let response = await callAPI(`markets/emid`, {
          params: { emid: matchId }
        });
        
        // If first endpoint fails, try alternative endpoints
        if (!response?.success || !response.data) {
          console.log('Trying alternative endpoint for odds...');
          response = await callAPI(`sports/gamesbysid`, {
            params: { gmid: matchId }
          });
        }
        
        if (response?.success && response.data) {
          console.log('Odds data received:', response.data);
          setOdds(response.data);
        } else {
          console.warn('No odds data available for match:', matchId);
          // Set mock odds for demonstration
          setOdds({
            markets: [{
              marketName: 'Match Odds',
              runners: [
                { name: match?.team1 || 'Team 1', back: [{ price: 1.85, size: 10000 }], lay: [{ price: 1.95, size: 10000 }] },
                { name: match?.team2 || 'Team 2', back: [{ price: 2.10, size: 10000 }], lay: [{ price: 2.20, size: 10000 }] }
              ]
            }]
          });
          
          toast({
            title: "Limited odds available",
            description: "Live odds are currently unavailable. Showing default rates.",
          });
        }
      } catch (error) {
        console.error('Failed to fetch odds:', error);
        
        // Set fallback odds on error
        setOdds({
          markets: [{
            marketName: 'Match Odds',
            runners: [
              { name: match?.team1 || 'Team 1', back: [{ price: 1.90, size: 5000 }], lay: [{ price: 2.00, size: 5000 }] },
              { name: match?.team2 || 'Team 2', back: [{ price: 2.05, size: 5000 }], lay: [{ price: 2.15, size: 5000 }] }
            ]
          }]
        });
        
        toast({
          title: "Using default odds",
          description: "Live API is unavailable. Showing default betting rates.",
        });
      } finally {
        setIsLoadingOdds(false);
      }
    };

    fetchOdds();
  }, [matchId, match, callAPI]);

  const handleSelectBet = (selection: any, type: 'back' | 'lay' | 'yes' | 'no', rate: number, marketType: string) => {
    setSelectedBet({
      selection,
      type,
      rate,
      marketType,
      matchId,
      matchName: `${match?.team1} vs ${match?.team2}`,
      sport
    });
  };

  const handlePlaceBet = async () => {
    if (!selectedBet || !betAmount || parseFloat(betAmount) <= 0) {
      toast({
        title: "Invalid bet",
        description: "Please enter a valid bet amount",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(betAmount);
    if (wallet && amount > (wallet as any).balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance to place this bet",
        variant: "destructive"
      });
      return;
    }

    setIsPlacingBet(true);
    try {
      // Here you would normally call your bet placement API
      // For now, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Bet placed successfully!",
        description: `Your ${selectedBet.type} bet of ₹${amount} has been placed`,
      });
      
      // Reset bet slip
      setSelectedBet(null);
      setBetAmount('');
    } catch (error) {
      toast({
        title: "Failed to place bet",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsPlacingBet(false);
    }
  };

  const calculatePotentialWin = () => {
    if (!betAmount || !selectedBet) return 0;
    const amount = parseFloat(betAmount);
    if (selectedBet.type === 'back') {
      return amount * selectedBet.rate;
    } else {
      // For lay bets, you win the stake amount
      return amount;
    }
  };

  const calculateLiability = () => {
    if (!betAmount || !selectedBet) return 0;
    const amount = parseFloat(betAmount);
    if (selectedBet.type === 'lay') {
      return amount * (selectedBet.rate - 1);
    }
    return amount;
  };

  if (!match) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Match not found</p>
              <Button 
                onClick={() => navigate('/sports')}
                className="mt-4"
              >
                Back to Sports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/sports')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sports
          </Button>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    {match.team1} vs {match.team2}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={match.status === 'Live' ? 'destructive' : 'secondary'}>
                      {match.status || 'Upcoming'}
                    </Badge>
                    <Badge variant="outline">{sport}</Badge>
                    {match.league && <Badge variant="outline">{match.league}</Badge>}
                  </div>
                </div>
                {match.score && (
                  <div className="text-right">
                    <p className="text-3xl font-bold">{match.score}</p>
                    <p className="text-sm text-muted-foreground mt-1">Current Score</p>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Live TV and Score Section */}
          <div className="lg:col-span-3">
            <LiveTVSection 
              matchId={matchId || ''} 
              match={match} 
              isLive={match?.status === 'Live'} 
            />
          </div>

          {/* Betting Markets */}
          <div className="lg:col-span-2">
            <EnhancedOddsDisplay 
              odds={odds}
              selectedBet={selectedBet}
              onSelectBet={(selection, type, rate, marketType) => {
                setSelectedBet({
                  selection,
                  type,
                  rate,
                  marketType,
                  matchId,
                  matchName: `${match?.team1} vs ${match?.team2}`,
                  sport
                });
              }}
              isLoading={isLoadingOdds}
            />
          </div>

          {/* Bet Slip */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Bet Slip</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedBet ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-semibold">{selectedBet.matchName}</p>
                      <p className="text-sm text-muted-foreground">{selectedBet.selection}</p>
                      <div className="flex justify-between mt-2">
                        <Badge variant={selectedBet.type === 'back' ? 'default' : 'destructive'}>
                          {selectedBet.type.toUpperCase()}
                        </Badge>
                        <span className="font-bold">{selectedBet.rate}</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bet-amount">Stake Amount (₹)</Label>
                      <Input
                        id="bet-amount"
                        type="number"
                        placeholder="Enter amount"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="space-y-2 p-3 bg-muted rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>Potential Win:</span>
                        <span className="font-semibold text-primary">
                          ₹{calculatePotentialWin().toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Liability:</span>
                        <span className="font-semibold text-destructive">
                          ₹{calculateLiability().toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={handlePlaceBet}
                        disabled={!betAmount || parseFloat(betAmount) <= 0 || isPlacingBet}
                      >
                        {isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSelectedBet(null);
                          setBetAmount('');
                        }}
                      >
                        Clear Bet Slip
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Select a bet to get started
                  </p>
                )}
                
                {/* Wallet Balance */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Wallet Balance:</span>
                    <span className="font-semibold">₹{wallet ? ((wallet as any).balance || 0).toFixed(2) : '0.00'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportsBet;