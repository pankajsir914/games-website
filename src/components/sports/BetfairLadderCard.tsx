import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceLadder {
  price: number;
  size: number;
}

interface BetfairLadderCardProps {
  runnerName: string;
  backLadder: PriceLadder[];
  layLadder: PriceLadder[];
  lastPriceTraded?: number | null;
  totalMatched?: number;
  tradedVolume?: PriceLadder[];
  onBet: (selection: string, odds: number, type: 'back' | 'lay', size?: number) => void;
}

export const BetfairLadderCard: React.FC<BetfairLadderCardProps> = ({
  runnerName,
  backLadder,
  layLadder,
  lastPriceTraded,
  totalMatched,
  tradedVolume,
  onBet
}) => {
  const maxBackSize = Math.max(...backLadder.map(p => p.size), 1);
  const maxLaySize = Math.max(...layLadder.map(p => p.size), 1);
  const maxTradedSize = tradedVolume ? Math.max(...tradedVolume.map(p => p.size), 1) : 1;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{runnerName}</CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm">
              {lastPriceTraded && (
                <div className="flex items-center gap-1">
                  <Activity className="h-3 w-3 text-gaming-primary" />
                  <span className="text-muted-foreground">LPT:</span>
                  <span className="font-mono font-semibold">{lastPriceTraded.toFixed(2)}</span>
                </div>
              )}
              {totalMatched !== undefined && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Matched:</span>
                  <span className="font-semibold">
                    ${totalMatched > 1000 ? `${(totalMatched / 1000).toFixed(1)}K` : totalMatched.toFixed(0)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="grid grid-cols-2 divide-x">
          {/* Back Side */}
          <div className="bg-blue-500/5">
            <div className="px-4 py-2 bg-blue-500/10 border-b">
              <h4 className="font-semibold text-sm flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Back (Buy)
              </h4>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="text-center h-8">Price</TableHead>
                  <TableHead className="text-right h-8">Size</TableHead>
                  <TableHead className="h-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {backLadder.length > 0 ? (
                  backLadder.slice(0, 5).map((level, idx) => (
                    <TableRow key={idx} className="hover:bg-blue-500/5">
                      <TableCell className="text-center font-mono py-2">
                        <span className={cn(
                          "font-semibold",
                          idx === 0 && "text-blue-600 dark:text-blue-400"
                        )}>
                          {level.price.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right py-2">
                        <div className="flex items-center justify-end gap-2">
                          <div 
                            className="bg-blue-500/20 h-2 rounded"
                            style={{ width: `${(level.size / maxBackSize) * 60}px` }}
                          />
                          <span className="text-sm font-medium">
                            ${level.size > 1000 ? `${(level.size / 1000).toFixed(1)}K` : level.size.toFixed(0)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 hover:bg-blue-500/10"
                          onClick={() => onBet(runnerName, level.price, 'back', level.size)}
                        >
                          Bet
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                      No back prices available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Lay Side */}
          <div className="bg-pink-500/5">
            <div className="px-4 py-2 bg-pink-500/10 border-b">
              <h4 className="font-semibold text-sm flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                Lay (Sell)
              </h4>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="h-8"></TableHead>
                  <TableHead className="text-left h-8">Size</TableHead>
                  <TableHead className="text-center h-8">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {layLadder.length > 0 ? (
                  layLadder.slice(0, 5).map((level, idx) => (
                    <TableRow key={idx} className="hover:bg-pink-500/5">
                      <TableCell className="py-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 hover:bg-pink-500/10"
                          onClick={() => onBet(runnerName, level.price, 'lay', level.size)}
                        >
                          Bet
                        </Button>
                      </TableCell>
                      <TableCell className="text-left py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            ${level.size > 1000 ? `${(level.size / 1000).toFixed(1)}K` : level.size.toFixed(0)}
                          </span>
                          <div 
                            className="bg-pink-500/20 h-2 rounded"
                            style={{ width: `${(level.size / maxLaySize) * 60}px` }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono py-2">
                        <span className={cn(
                          "font-semibold",
                          idx === 0 && "text-pink-600 dark:text-pink-400"
                        )}>
                          {level.price.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                      No lay prices available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Traded Volume */}
        {tradedVolume && tradedVolume.length > 0 && (
          <div className="border-t bg-muted/30 p-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Recent Traded Volume
            </h4>
            <div className="space-y-1">
              {tradedVolume.slice(0, 5).map((trade, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {trade.price.toFixed(2)}
                    </Badge>
                    <div 
                      className="bg-gaming-primary/20 h-1.5 rounded"
                      style={{ width: `${(trade.size / maxTradedSize) * 100}px` }}
                    />
                  </div>
                  <span className="text-muted-foreground">
                    ${trade.size > 1000 ? `${(trade.size / 1000).toFixed(1)}K` : trade.size.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BetfairLadderCard;