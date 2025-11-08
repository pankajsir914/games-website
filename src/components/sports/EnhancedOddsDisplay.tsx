import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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

  // Organize markets by type - handle both direct and nested formats
  const oddsData = odds.data || odds;
  const matchMarkets = oddsData.t1 || [];
  const fancyMarkets = oddsData.t2 || [];
  const bookmakerMarkets = oddsData.t3 || [];

  // Render odds cell with proper styling
  const renderOddsCell = (
    selection: string,
    type: 'back' | 'lay',
    rate: string | number | null,
    size: string | number | null,
    marketType: string,
    isSuspended: boolean = false
  ) => {
    if (!rate || isSuspended) {
      return (
        <TableCell className={cn(
          "text-center p-2 cursor-not-allowed",
          type === 'back' ? "bg-blue-100" : "bg-pink-100"
        )}>
          <span className="text-xs text-destructive font-semibold">-</span>
        </TableCell>
      );
    }

    const isSelected = selectedBet?.selection === selection && 
                      selectedBet?.type === type && 
                      selectedBet?.marketType === marketType;

    return (
      <TableCell 
        className={cn(
          "text-center p-2 cursor-pointer hover:opacity-80 transition-opacity",
          type === 'back' ? "bg-blue-200 hover:bg-blue-300" : "bg-pink-200 hover:bg-pink-300",
          isSelected && "ring-2 ring-primary ring-inset"
        )}
        onClick={() => !isSuspended && onSelectBet(selection, type, parseFloat(rate.toString()), marketType)}
      >
        <div className="flex flex-col items-center">
          <span className="font-bold text-base text-foreground">{parseFloat(rate.toString()).toFixed(2)}</span>
          {size && <span className="text-xs text-foreground/80">{size}</span>}
        </div>
      </TableCell>
    );
  };

  return (
    <Card>
      <CardContent className="p-4">
        <ScrollArea className="w-full">
          <div className="space-y-6">
            {/* Match Odds Section */}
            {matchMarkets.length > 0 && matchMarkets.map((market: any, marketIdx: number) => (
              <div key={marketIdx} className="space-y-2">
                <div className="bg-slate-700 text-white px-4 py-2 rounded-t font-semibold flex items-center justify-between">
                  <span>Match Odds {market.mname ? `- ${market.mname}` : ''}</span>
                  {market.mid && <span className="text-xs opacity-80">Market ID: {market.mid}</span>}
                </div>
                <div className="overflow-x-auto">
                  <Table className="border">
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="font-semibold text-foreground min-w-[150px]">Selection</TableHead>
                        <TableHead className="text-center text-xs text-muted-foreground w-12"></TableHead>
                        <TableHead className="text-center text-xs text-muted-foreground w-12"></TableHead>
                        <TableHead className="text-center text-xs text-muted-foreground w-12"></TableHead>
                        <TableHead className="text-center font-semibold bg-blue-100 text-foreground w-20">Back</TableHead>
                        <TableHead className="text-center font-semibold bg-blue-100 text-foreground w-20">Back</TableHead>
                        <TableHead className="text-center font-semibold bg-blue-100 text-foreground w-20">Back</TableHead>
                        <TableHead className="text-center font-semibold bg-pink-100 text-foreground w-20">Lay</TableHead>
                        <TableHead className="text-center font-semibold bg-pink-100 text-foreground w-20">Lay</TableHead>
                        <TableHead className="text-center font-semibold bg-pink-100 text-foreground w-20">Lay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(market.section || []).map((team: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground p-3">
                            {team.gstatus === 'SUSPENDED' ? (
                              <span className="text-destructive font-semibold">SUSPENDED</span>
                            ) : (
                              team.nat || team.name || `Team ${idx + 1}`
                            )}
                            {team.sid && <span className="text-xs text-muted-foreground ml-2">(ID: {team.sid})</span>}
                          </TableCell>
                          <TableCell className="bg-slate-50"></TableCell>
                          <TableCell className="bg-slate-50"></TableCell>
                          <TableCell className="bg-slate-50"></TableCell>
                          {renderOddsCell(team.nat || team.name, 'back', team.b1, team.bs1, `match-${marketIdx}`, team.gstatus === 'SUSPENDED')}
                          {renderOddsCell(team.nat || team.name, 'back', team.b2, team.bs2, `match-${marketIdx}`, team.gstatus === 'SUSPENDED')}
                          {renderOddsCell(team.nat || team.name, 'back', team.b3, team.bs3, `match-${marketIdx}`, team.gstatus === 'SUSPENDED')}
                          {renderOddsCell(team.nat || team.name, 'lay', team.l1, team.ls1, `match-${marketIdx}`, team.gstatus === 'SUSPENDED')}
                          {renderOddsCell(team.nat || team.name, 'lay', team.l2, team.ls2, `match-${marketIdx}`, team.gstatus === 'SUSPENDED')}
                          {renderOddsCell(team.nat || team.name, 'lay', team.l3, team.ls3, `match-${marketIdx}`, team.gstatus === 'SUSPENDED')}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}

            {/* Bookmaker Section */}
            {bookmakerMarkets.length > 0 && bookmakerMarkets.map((bookmakerGroup: any, groupIdx: number) => (
              <div key={groupIdx} className="space-y-2">
                <div className="bg-slate-700 text-white px-4 py-2 font-semibold flex items-center justify-between">
                  <span>Bookmaker {bookmakerGroup.mname ? `- ${bookmakerGroup.mname}` : ''}</span>
                  {bookmakerGroup.mid && <span className="text-xs opacity-80">Market ID: {bookmakerGroup.mid}</span>}
                </div>
                <div className="overflow-x-auto">
                  <Table className="border">
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className="font-semibold text-foreground min-w-[150px]">Selection</TableHead>
                        <TableHead className="text-center font-semibold bg-blue-100 text-foreground w-24">Back</TableHead>
                        <TableHead className="text-center font-semibold bg-pink-100 text-foreground w-24">Lay</TableHead>
                        <TableHead className="text-center text-xs text-muted-foreground w-20">Min/Max</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(bookmakerGroup.section || (Array.isArray(bookmakerGroup) ? bookmakerGroup : [bookmakerGroup])).map((bookmaker: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground p-3">
                            {bookmaker.gstatus === 'SUSPENDED' ? (
                              <span className="text-destructive font-semibold">SUSPENDED</span>
                            ) : (
                              bookmaker.nat || bookmaker.name || `Selection ${idx + 1}`
                            )}
                            {bookmaker.sid && <span className="text-xs text-muted-foreground ml-2">(ID: {bookmaker.sid})</span>}
                          </TableCell>
                          {renderOddsCell(bookmaker.nat || bookmaker.name, 'back', bookmaker.b1, bookmaker.bs1, `bookmaker-${groupIdx}`, bookmaker.gstatus === 'SUSPENDED')}
                          {renderOddsCell(bookmaker.nat || bookmaker.name, 'lay', bookmaker.l1, bookmaker.ls1, `bookmaker-${groupIdx}`, bookmaker.gstatus === 'SUSPENDED')}
                          <TableCell className="text-center text-xs text-muted-foreground">
                            {bookmaker.min && bookmaker.max ? `${bookmaker.min}-${bookmaker.max}` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}

            {/* Fancy Markets Section */}
            {fancyMarkets.length > 0 && (
              <div className="space-y-4">
                <div className="bg-slate-700 text-white px-4 py-2 font-semibold">
                  Fancy Markets
                </div>
                
                {/* Display all fancy markets with full details */}
                {fancyMarkets.map((fancyGroup: any, groupIdx: number) => {
                  // Check if it's a group with sections or individual fancy
                  const fancyItems = fancyGroup.section || [fancyGroup];
                  
                  return (
                    <div key={groupIdx} className="space-y-2">
                      {fancyGroup.mname && (
                        <div className="bg-slate-600 text-white px-4 py-1.5 text-sm font-medium flex items-center justify-between">
                          <span>{fancyGroup.mname}</span>
                          {fancyGroup.mid && <span className="text-xs opacity-80">Market ID: {fancyGroup.mid}</span>}
                        </div>
                      )}
                      
                      <div className="overflow-x-auto">
                        <Table className="border">
                          <TableHeader>
                            <TableRow className="bg-muted">
                              <TableHead className="font-semibold text-foreground min-w-[180px]">Selection</TableHead>
                              <TableHead className="text-center text-xs text-muted-foreground w-20">Line</TableHead>
                              <TableHead className="text-center font-semibold bg-pink-100 text-foreground w-24">No</TableHead>
                              <TableHead className="text-center font-semibold bg-blue-100 text-foreground w-24">Yes</TableHead>
                              <TableHead className="text-center text-xs text-muted-foreground w-20">Min/Max</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fancyItems.map((fancy: any, idx: number) => (
                              <TableRow key={idx} className="hover:bg-muted/50">
                                <TableCell className="font-medium text-foreground p-3">
                                  {fancy.gstatus === 'SUSPENDED' ? (
                                    <span className="text-destructive font-semibold">SUSPENDED</span>
                                  ) : (
                                    fancy.nat || fancy.name || `Fancy ${idx + 1}`
                                  )}
                                  {fancy.sid && <span className="text-xs text-muted-foreground ml-2">(ID: {fancy.sid})</span>}
                                </TableCell>
                                <TableCell className="text-center text-sm font-semibold text-foreground">
                                  {fancy.line || '-'}
                                </TableCell>
                                {renderOddsCell(fancy.nat || fancy.name, 'lay', fancy.l1, fancy.ls1, `fancy-${groupIdx}-${idx}`, fancy.gstatus === 'SUSPENDED')}
                                {renderOddsCell(fancy.nat || fancy.name, 'back', fancy.b1, fancy.bs1, `fancy-${groupIdx}-${idx}`, fancy.gstatus === 'SUSPENDED')}
                                <TableCell className="text-center text-xs text-muted-foreground">
                                  {fancy.min && fancy.max ? `${fancy.min}-${fancy.max}` : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state if no markets */}
            {matchMarkets.length === 0 && bookmakerMarkets.length === 0 && fancyMarkets.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No betting markets available</p>
                <p className="text-sm mt-2">Check back closer to match time</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EnhancedOddsDisplay;