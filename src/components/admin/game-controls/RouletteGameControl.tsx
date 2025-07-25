import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Zap, Timer, TrendingUp, RotateCcw, Circle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const RouletteGameControl = () => {
  const [cheatMode, setCheatMode] = useState(false);
  const [forcedNumber, setForcedNumber] = useState<number | null>(null);
  const [forcedColor, setForcedColor] = useState<string>('');
  const [manipulationType, setManipulationType] = useState('number');

  const rouletteNumbers = Array.from({ length: 37 }, (_, i) => i); // 0-36
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

  const getNumberColor = (num: number) => {
    if (num === 0) return 'green';
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  const handleForceResult = () => {
    toast({
      title: "Result Forced",
      description: `Next spin will land on ${forcedNumber !== null ? forcedNumber : forcedColor}`,
    });
  };

  const handleGameControl = (action: string) => {
    toast({
      title: "Game Action",
      description: `${action} executed successfully`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Game Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Roulette Game Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gaming-success">Round #567</p>
              <p className="text-sm text-muted-foreground">Current Round</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">892</p>
              <p className="text-sm text-muted-foreground">Active Players</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gaming-gold">₹1,24,350</p>
              <p className="text-sm text-muted-foreground">Total Bets</p>
            </div>
            <div className="text-center">
              <Badge className="bg-gaming-success">Spinning</Badge>
              <p className="text-sm text-muted-foreground mt-1">Round Status</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="controls">Game Controls</TabsTrigger>
          <TabsTrigger value="wheel">Wheel Management</TabsTrigger>
          <TabsTrigger value="bets">Bet Analytics</TabsTrigger>
          <TabsTrigger value="history">Spin History</TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Result Manipulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="cheat-mode">Cheat Mode</Label>
                <Switch
                  id="cheat-mode"
                  checked={cheatMode}
                  onCheckedChange={setCheatMode}
                />
              </div>

              {cheatMode && (
                <div className="space-y-4 p-4 border rounded-lg bg-destructive/5">
                  <div className="space-y-2">
                    <Label>Manipulation Type</Label>
                    <Select value={manipulationType} onValueChange={setManipulationType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="number">Specific Number</SelectItem>
                        <SelectItem value="color">Color (Red/Black)</SelectItem>
                        <SelectItem value="even-odd">Even/Odd</SelectItem>
                        <SelectItem value="range">Number Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {manipulationType === 'number' && (
                    <div className="space-y-2">
                      <Label>Force Number</Label>
                      <Select value={forcedNumber?.toString() || ''} onValueChange={(value) => setForcedNumber(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number" />
                        </SelectTrigger>
                        <SelectContent>
                          {rouletteNumbers.map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              <div className="flex items-center gap-2">
                                <Circle className={`h-3 w-3 fill-current ${
                                  getNumberColor(num) === 'red' ? 'text-red-500' :
                                  getNumberColor(num) === 'black' ? 'text-black' : 'text-green-500'
                                }`} />
                                {num}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {manipulationType === 'color' && (
                    <div className="space-y-2">
                      <Label>Force Color</Label>
                      <Select value={forcedColor} onValueChange={setForcedColor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select color" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="red">Red</SelectItem>
                          <SelectItem value="black">Black</SelectItem>
                          <SelectItem value="green">Green (0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="destructive" className="flex-1" onClick={handleForceResult}>
                      <Target className="mr-2 h-4 w-4" />
                      Force Next Spin
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => handleGameControl('Start New Spin')}>
                  <Timer className="mr-2 h-4 w-4" />
                  Start New Spin
                </Button>
                <Button variant="outline" onClick={() => handleGameControl('End Betting')}>
                  End Betting
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wheel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roulette Wheel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-8 gap-2">
                {rouletteNumbers.map((num) => (
                  <Button
                    key={num}
                    variant="outline"
                    size="sm"
                    className={`h-12 ${
                      getNumberColor(num) === 'red' ? 'bg-red-500 text-white hover:bg-red-600' :
                      getNumberColor(num) === 'black' ? 'bg-black text-white hover:bg-gray-800' :
                      'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    onClick={() => setForcedNumber(num)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Bet Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Red</span>
                    <div className="text-right">
                      <p className="font-bold">₹45,680</p>
                      <p className="text-sm text-muted-foreground">327 bets</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Black</span>
                    <div className="text-right">
                      <p className="font-bold">₹42,320</p>
                      <p className="text-sm text-muted-foreground">298 bets</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Numbers</span>
                    <div className="text-right">
                      <p className="font-bold">₹36,350</p>
                      <p className="text-sm text-muted-foreground">267 bets</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Today's Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Spins</span>
                    <span className="font-bold">567</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Revenue</span>
                    <span className="font-bold text-gaming-success">₹8,92,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span>House Edge</span>
                    <span className="font-bold">2.7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Spin Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { spin: 566, number: 17, color: 'black', payout: '₹2,85,000' },
                  { spin: 565, number: 0, color: 'green', payout: '₹1,24,500' },
                  { spin: 564, number: 23, color: 'red', payout: '₹3,42,800' },
                  { spin: 563, number: 8, color: 'black', payout: '₹1,98,200' },
                  { spin: 562, number: 31, color: 'black', payout: '₹2,67,400' }
                ].map((result) => (
                  <div key={result.spin} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">#{result.spin}</span>
                      <div className="flex items-center gap-2">
                        <Circle className={`h-4 w-4 fill-current ${
                          result.color === 'red' ? 'text-red-500' :
                          result.color === 'black' ? 'text-black' : 'text-green-500'
                        }`} />
                        <span className="text-lg font-bold">{result.number}</span>
                      </div>
                      <Badge variant={result.color === 'red' ? 'destructive' : result.color === 'black' ? 'secondary' : 'default'}>
                        {result.color}
                      </Badge>
                    </div>
                    <span className="font-medium text-gaming-success">{result.payout}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};