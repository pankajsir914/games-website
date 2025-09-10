import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp, TrendingDown, Trophy, Target, Users, Zap, Star, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedOddsDisplayProps {
  odds: any;
  onSelectBet: (selection: any, type: 'back' | 'lay' | 'yes' | 'no', rate: number, marketType: string) => void;
  selectedBet: any;
  isLoading?: boolean;
}

const EnhancedOddsDisplay: React.FC<EnhancedOddsDisplayProps> = ({
  odds,
  onSelectBet,
  selectedBet,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">Loading betting markets...</p>
        </CardContent>
      </Card>
    );
  }

  if (!odds) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No betting markets available</p>
        </CardContent>
      </Card>
    );
  }

  // Organize markets by type
  const matchMarkets = odds.data?.t1 || odds.markets || [];
  const fancyMarkets = odds.data?.t2 || [];
  const bookmakerMarkets = odds.data?.t3 || [];

  const renderOddsButton = (
    selection: string,
    type: 'back' | 'lay',
    rate: number,
    size?: number,
    marketType: string = 'match'
  ) => {
    const isSelected = selectedBet?.selection === selection && 
                      selectedBet?.type === type && 
                      selectedBet?.marketType === marketType;
    
    return (
      <Button
        variant={isSelected ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectBet(selection, type, rate, marketType)}
        className={cn(
          "relative overflow-hidden transition-all",
          type === 'back' 
            ? "bg-primary/10 hover:bg-primary/20 border-primary/30" 
            : "bg-destructive/10 hover:bg-destructive/20 border-destructive/30",
          isSelected && "ring-2 ring-offset-2"
        )}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs uppercase opacity-70">{type}</span>
          <span className="font-bold text-lg">{rate.toFixed(2)}</span>
          {size && (
            <span className="text-xs opacity-70">₹{size}</span>
          )}
        </div>
      </Button>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Betting Markets</span>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              Min: ₹100
            </Badge>
            <Badge variant="outline" className="text-xs">
              Max: ₹10,000
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="match" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="match" className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Match
            </TabsTrigger>
            <TabsTrigger value="fancy" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Fancy
            </TabsTrigger>
            <TabsTrigger value="bookmaker" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Bookmaker
            </TabsTrigger>
            <TabsTrigger value="special" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Special
            </TabsTrigger>
          </TabsList>

          <TabsContent value="match" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* Match Winner Market */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Match Winner</h4>
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchMarkets[0]?.section?.map((team: any, idx: number) => (
                      <div key={idx} className="space-y-2">
                        <p className="font-medium">{team.nat || `Team ${idx + 1}`}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {team.b1 && renderOddsButton(team.nat, 'back', parseFloat(team.b1), team.bs1, 'match')}
                          {team.l1 && renderOddsButton(team.nat, 'lay', parseFloat(team.l1), team.ls1, 'match')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Match Markets */}
                {matchMarkets.slice(1).map((market: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3">{market.nat || market.marketName}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {market.section?.map((option: any, optIdx: number) => (
                        <div key={optIdx} className="space-y-2">
                          <p className="text-sm">{option.nat}</p>
                          <div className="grid grid-cols-2 gap-1">
                            {option.b1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-primary/10 text-xs"
                                onClick={() => onSelectBet(option.nat, 'back', parseFloat(option.b1), 'match')}
                              >
                                {option.b1}
                              </Button>
                            )}
                            {option.l1 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-destructive/10 text-xs"
                                onClick={() => onSelectBet(option.nat, 'lay', parseFloat(option.l1), 'match')}
                              >
                                {option.l1}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="fancy" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {fancyMarkets.length > 0 ? (
                  fancyMarkets.map((fancy: any) => (
                    <div key={fancy.sid} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{fancy.nat}</h4>
                        {fancy.suspended && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Suspended
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">No</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-destructive/10"
                            disabled={fancy.suspended}
                            onClick={() => onSelectBet(fancy.nat, 'no', parseFloat(fancy.l1 || '0'), 'fancy')}
                          >
                            <div>
                              <p className="font-bold">{fancy.l1 || '-'}</p>
                              <p className="text-xs">{fancy.ls1 || ''}</p>
                            </div>
                          </Button>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Line</p>
                          <div className="bg-muted rounded px-2 py-3">
                            <p className="font-bold">{fancy.line || '-'}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Yes</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-primary/10"
                            disabled={fancy.suspended}
                            onClick={() => onSelectBet(fancy.nat, 'yes', parseFloat(fancy.b1 || '0'), 'fancy')}
                          >
                            <div>
                              <p className="font-bold">{fancy.b1 || '-'}</p>
                              <p className="text-xs">{fancy.bs1 || ''}</p>
                            </div>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No fancy markets available</p>
                    <p className="text-sm mt-2">Check back closer to match time</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bookmaker" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {bookmakerMarkets.length > 0 ? (
                  bookmakerMarkets.map((bookmaker: any) => (
                    <div key={bookmaker.sid} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">{bookmaker.nat}</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Back</p>
                          <Button
                            variant="outline"
                            className="w-full bg-primary/10"
                            onClick={() => onSelectBet(bookmaker.nat, 'back', parseFloat(bookmaker.b1 || '0'), 'bookmaker')}
                          >
                            <div>
                              <p className="font-bold text-lg">{bookmaker.b1 || '-'}</p>
                              <p className="text-xs">₹{bookmaker.bs1 || '0'}</p>
                            </div>
                          </Button>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Lay</p>
                          <Button
                            variant="outline"
                            className="w-full bg-destructive/10"
                            onClick={() => onSelectBet(bookmaker.nat, 'lay', parseFloat(bookmaker.l1 || '0'), 'bookmaker')}
                          >
                            <div>
                              <p className="font-bold text-lg">{bookmaker.l1 || '-'}</p>
                              <p className="text-xs">₹{bookmaker.ls1 || '0'}</p>
                            </div>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No bookmaker markets available</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="special" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                <div className="text-center py-12 text-muted-foreground">
                  <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Special markets coming soon</p>
                  <p className="text-sm mt-2">Check back for exclusive betting options</p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedOddsDisplay;