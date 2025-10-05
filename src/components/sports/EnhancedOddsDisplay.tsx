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

  // Organize markets by type
  const matchMarkets = odds.data?.t1 || odds.markets || [];
  const fancyMarkets = odds.data?.t2 || [];
  const bookmakerMarkets = odds.data?.t3 || [];

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
          <span className="text-xs text-red-600 font-semibold">-</span>
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
          <span className="font-bold text-base text-gray-900">{parseFloat(rate.toString()).toFixed(2)}</span>
          {size && <span className="text-xs text-gray-700">{size}</span>}
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
            {matchMarkets.length > 0 && (
              <div className="space-y-2">
                <div className="bg-slate-700 text-white px-4 py-2 rounded-t font-semibold">
                  Match Odds
                </div>
                <div className="overflow-x-auto">
                  <Table className="border">
                    <TableHeader>
                      <TableRow className="bg-slate-100">
                        <TableHead className="font-semibold text-gray-900 min-w-[150px]"></TableHead>
                        <TableHead className="text-center text-xs text-gray-600 w-12"></TableHead>
                        <TableHead className="text-center text-xs text-gray-600 w-12"></TableHead>
                        <TableHead className="text-center text-xs text-gray-600 w-12"></TableHead>
                        <TableHead className="text-center font-semibold bg-blue-100 text-blue-900 w-20">Back</TableHead>
                        <TableHead className="text-center font-semibold bg-blue-100 text-blue-900 w-20">Back</TableHead>
                        <TableHead className="text-center font-semibold bg-blue-100 text-blue-900 w-20">Back</TableHead>
                        <TableHead className="text-center font-semibold bg-pink-100 text-pink-900 w-20">Lay</TableHead>
                        <TableHead className="text-center font-semibold bg-pink-100 text-pink-900 w-20">Lay</TableHead>
                        <TableHead className="text-center font-semibold bg-pink-100 text-pink-900 w-20">Lay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matchMarkets[0]?.section?.map((team: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-slate-50">
                          <TableCell className="font-medium text-gray-900 p-3">
                            {team.gstatus === 'SUSPENDED' ? (
                              <span className="text-red-600 font-semibold">SUSPENDED</span>
                            ) : (
                              team.nat || `Team ${idx + 1}`
                            )}
                          </TableCell>
                          <TableCell className="bg-slate-50"></TableCell>
                          <TableCell className="bg-slate-50"></TableCell>
                          <TableCell className="bg-slate-50"></TableCell>
                          {renderOddsCell(team.nat, 'back', team.b1, team.bs1, 'match', team.gstatus === 'SUSPENDED')}
                          {renderOddsCell(team.nat, 'back', team.b2, team.bs2, 'match', team.gstatus === 'SUSPENDED')}
                          {renderOddsCell(team.nat, 'back', team.b3, team.bs3, 'match', team.gstatus === 'SUSPENDED')}
                          {renderOddsCell(team.nat, 'lay', team.l1, team.ls1, 'match', team.gstatus === 'SUSPENDED')}
                          {renderOddsCell(team.nat, 'lay', team.l2, team.ls2, 'match', team.gstatus === 'SUSPENDED')}
                          {renderOddsCell(team.nat, 'lay', team.l3, team.ls3, 'match', team.gstatus === 'SUSPENDED')}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Bookmaker Section */}
            {bookmakerMarkets.length > 0 && (
              <div className="space-y-2">
                <div className="bg-slate-700 text-white px-4 py-2 font-semibold">
                  Bookmaker
                </div>
                <div className="overflow-x-auto">
                  <Table className="border">
                    <TableHeader>
                      <TableRow className="bg-slate-100">
                        <TableHead className="font-semibold text-gray-900 min-w-[150px]"></TableHead>
                        <TableHead className="text-center font-semibold bg-blue-100 text-blue-900 w-24">Back</TableHead>
                        <TableHead className="text-center font-semibold bg-pink-100 text-pink-900 w-24">Lay</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookmakerMarkets.map((bookmaker: any) => (
                        <TableRow key={bookmaker.sid} className="hover:bg-slate-50">
                          <TableCell className="font-medium text-gray-900 p-3">
                            {bookmaker.gstatus === 'SUSPENDED' ? (
                              <span className="text-red-600 font-semibold">SUSPENDED</span>
                            ) : (
                              bookmaker.nat
                            )}
                          </TableCell>
                          {renderOddsCell(bookmaker.nat, 'back', bookmaker.b1, bookmaker.bs1, 'bookmaker', bookmaker.gstatus === 'SUSPENDED')}
                          {renderOddsCell(bookmaker.nat, 'lay', bookmaker.l1, bookmaker.ls1, 'bookmaker', bookmaker.gstatus === 'SUSPENDED')}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Fancy Markets Section */}
            {fancyMarkets.length > 0 && (
              <div className="space-y-4">
                <div className="bg-slate-700 text-white px-4 py-2 font-semibold">
                  Fancy Markets
                </div>
                
                {/* Group fancy markets by type */}
                {fancyMarkets.map((fancy: any) => (
                  <div key={fancy.sid} className="space-y-2">
                    <div className="bg-slate-600 text-white px-4 py-1.5 text-sm font-medium">
                      {fancy.nat}
                    </div>
                    <div className="overflow-x-auto">
                      <Table className="border">
                        <TableHeader>
                          <TableRow className="bg-slate-100">
                            <TableHead className="font-semibold text-gray-900 min-w-[120px]"></TableHead>
                            <TableHead className="text-center font-semibold bg-pink-100 text-pink-900 w-24">No</TableHead>
                            <TableHead className="text-center font-semibold bg-blue-100 text-blue-900 w-24">Yes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="hover:bg-slate-50">
                            <TableCell className="font-medium text-gray-900 p-3">
                              {fancy.gstatus === 'SUSPENDED' ? (
                                <span className="text-red-600 font-semibold">SUSPENDED</span>
                              ) : (
                                `Line: ${fancy.line || '-'}`
                              )}
                            </TableCell>
                            {renderOddsCell(fancy.nat, 'lay', fancy.l1, fancy.ls1, 'fancy', fancy.gstatus === 'SUSPENDED')}
                            {renderOddsCell(fancy.nat, 'back', fancy.b1, fancy.bs1, 'fancy', fancy.gstatus === 'SUSPENDED')}
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
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