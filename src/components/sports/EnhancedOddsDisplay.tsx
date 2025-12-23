import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
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
          "text-center cursor-not-allowed min-h-[44px]",
          isMobile ? "p-1.5 min-w-[60px]" : "p-2 min-w-[80px]",
          type === 'back' ? "bg-blue-100" : "bg-pink-100"
        )}>
          <span className={cn("text-destructive font-semibold", isMobile ? "text-xs" : "text-sm")}>-</span>
        </TableCell>
      );
    }

    const isSelected = selectedBet?.selection === selection && 
                      selectedBet?.type === type && 
                      selectedBet?.marketType === marketType;

    return (
      <TableCell 
        className={cn(
          "text-center cursor-pointer transition-opacity min-h-[44px]",
          isMobile ? "p-1.5 min-w-[60px] active:opacity-70" : "p-2 min-w-[80px] hover:opacity-80",
          type === 'back' ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-pink-500 hover:bg-pink-600 text-white",
          isSelected && "ring-2 ring-yellow-400 ring-inset"
        )}
        onClick={() => !isSuspended && onSelectBet(selection, type, parseFloat(rate.toString()), marketType)}
      >
        <div className="flex flex-col items-center">
          <span className={cn("font-bold", isMobile ? "text-sm" : "text-base")}>
            {parseFloat(rate.toString()).toFixed(2)}
          </span>
          {size && <span className="text-xs opacity-80">{size}</span>}
        </div>
      </TableCell>
    );
  };

  return (
    <Card>
      <CardContent className={cn("p-4", isMobile && "p-2")}>
        <ScrollArea className="w-full">
          <div className={cn("space-y-6", isMobile && "space-y-4")}>
            {/* Match Odds Section */}
            {matchMarkets.length > 0 && matchMarkets.map((market: any, marketIdx: number) => (
              <div key={marketIdx} className="space-y-2">
                <div className={cn(
                  "bg-slate-700 text-white rounded-t font-semibold flex items-center justify-between",
                  isMobile ? "px-2 py-1.5 text-sm" : "px-4 py-2"
                )}>
                  <span>Match Odds {market.mname && !isMobile ? `- ${market.mname}` : ''}</span>
                  {market.mid && !isMobile && <span className="text-xs opacity-80">Market ID: {market.mid}</span>}
                </div>
                <div className="overflow-x-auto">
                  <Table className="border">
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className={cn(
                          "font-semibold text-foreground sticky left-0 bg-muted z-10",
                          isMobile ? "min-w-[100px] text-xs" : "min-w-[150px] text-sm"
                        )}>
                          Selection
                        </TableHead>
                        {!isMobile && (
                          <>
                            <TableHead className="text-center text-xs text-muted-foreground w-12"></TableHead>
                            <TableHead className="text-center text-xs text-muted-foreground w-12"></TableHead>
                            <TableHead className="text-center text-xs text-muted-foreground w-12"></TableHead>
                          </>
                        )}
                        <TableHead className={cn("text-center font-semibold bg-blue-600 text-white", isMobile ? "text-xs w-16" : "text-sm w-20")}>Back</TableHead>
                        {!isMobile && (
                          <>
                            <TableHead className="text-center font-semibold bg-blue-600 text-white w-20">Back</TableHead>
                            <TableHead className="text-center font-semibold bg-blue-600 text-white w-20">Back</TableHead>
                          </>
                        )}
                        <TableHead className={cn("text-center font-semibold bg-pink-600 text-white", isMobile ? "text-xs w-16" : "text-sm w-20")}>Lay</TableHead>
                        {!isMobile && (
                          <>
                            <TableHead className="text-center font-semibold bg-pink-600 text-white w-20">Lay</TableHead>
                            <TableHead className="text-center font-semibold bg-pink-600 text-white w-20">Lay</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(market.section || []).map((team: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell className={cn(
                            "font-medium text-foreground sticky left-0 bg-background z-10",
                            isMobile ? "p-2 text-xs" : "p-3 text-sm"
                          )}>
                            {team.gstatus === 'SUSPENDED' ? (
                              <span className="text-destructive font-semibold">SUSP</span>
                            ) : (
                              team.nat || team.name || `Team ${idx + 1}`
                            )}
                            {team.sid && !isMobile && <span className="text-xs text-muted-foreground ml-2">(ID: {team.sid})</span>}
                          </TableCell>
                          {!isMobile && (
                            <>
                              <TableCell className="bg-slate-50"></TableCell>
                              <TableCell className="bg-slate-50"></TableCell>
                              <TableCell className="bg-slate-50"></TableCell>
                            </>
                          )}
                          {renderOddsCell(team.nat || team.name, 'back', team.b1, team.bs1, `match-${marketIdx}`, team.gstatus === 'SUSPENDED')}
                          {!isMobile && (
                            <>
                              {renderOddsCell(team.nat || team.name, 'back', team.b2, team.bs2, `match-${marketIdx}`, team.gstatus === 'SUSPENDED')}
                              {renderOddsCell(team.nat || team.name, 'back', team.b3, team.bs3, `match-${marketIdx}`, team.gstatus === 'SUSPENDED')}
                            </>
                          )}
                          {renderOddsCell(team.nat || team.name, 'lay', team.l1, team.ls1, `match-${marketIdx}`, team.gstatus === 'SUSPENDED')}
                          {!isMobile && (
                            <>
                              {renderOddsCell(team.nat || team.name, 'lay', team.l2, team.ls2, `match-${marketIdx}`, team.gstatus === 'SUSPENDED')}
                              {renderOddsCell(team.nat || team.name, 'lay', team.l3, team.ls3, `match-${marketIdx}`, team.gstatus === 'SUSPENDED')}
                            </>
                          )}
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
                <div className={cn(
                  "bg-slate-700 text-white font-semibold flex items-center justify-between",
                  isMobile ? "px-2 py-1.5 text-sm" : "px-4 py-2"
                )}>
                  <span>Bookmaker {bookmakerGroup.mname && !isMobile ? `- ${bookmakerGroup.mname}` : ''}</span>
                  {bookmakerGroup.mid && !isMobile && <span className="text-xs opacity-80">Market ID: {bookmakerGroup.mid}</span>}
                </div>
                <div className="overflow-x-auto">
                  <Table className="border">
                    <TableHeader>
                      <TableRow className="bg-muted">
                        <TableHead className={cn(
                          "font-semibold text-foreground sticky left-0 bg-muted z-10",
                          isMobile ? "min-w-[100px] text-xs" : "min-w-[150px] text-sm"
                        )}>
                          Selection
                        </TableHead>
                        <TableHead className={cn("text-center font-semibold bg-blue-600 text-white", isMobile ? "text-xs w-20" : "text-sm w-24")}>Back</TableHead>
                        <TableHead className={cn("text-center font-semibold bg-pink-600 text-white", isMobile ? "text-xs w-20" : "text-sm w-24")}>Lay</TableHead>
                        {!isMobile && <TableHead className="text-center text-xs text-muted-foreground w-20">Min/Max</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(bookmakerGroup.section || (Array.isArray(bookmakerGroup) ? bookmakerGroup : [bookmakerGroup])).map((bookmaker: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell className={cn(
                            "font-medium text-foreground sticky left-0 bg-background z-10",
                            isMobile ? "p-2 text-xs" : "p-3 text-sm"
                          )}>
                            {bookmaker.gstatus === 'SUSPENDED' ? (
                              <span className="text-destructive font-semibold">SUSP</span>
                            ) : (
                              bookmaker.nat || bookmaker.name || `Selection ${idx + 1}`
                            )}
                            {bookmaker.sid && !isMobile && <span className="text-xs text-muted-foreground ml-2">(ID: {bookmaker.sid})</span>}
                          </TableCell>
                          {renderOddsCell(bookmaker.nat || bookmaker.name, 'back', bookmaker.b1, bookmaker.bs1, `bookmaker-${groupIdx}`, bookmaker.gstatus === 'SUSPENDED')}
                          {renderOddsCell(bookmaker.nat || bookmaker.name, 'lay', bookmaker.l1, bookmaker.ls1, `bookmaker-${groupIdx}`, bookmaker.gstatus === 'SUSPENDED')}
                          {!isMobile && (
                            <TableCell className="text-center text-xs text-muted-foreground">
                              {bookmaker.min && bookmaker.max ? `${bookmaker.min}-${bookmaker.max}` : '-'}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}

            {/* Fancy Markets Section */}
            {fancyMarkets.length > 0 && (
              <div className={cn("space-y-4", isMobile && "space-y-2")}>
                <div className={cn(
                  "bg-slate-700 text-white font-semibold",
                  isMobile ? "px-2 py-1.5 text-sm" : "px-4 py-2"
                )}>
                  Fancy Markets
                </div>
                
                {/* Display all fancy markets with full details */}
                {fancyMarkets.map((fancyGroup: any, groupIdx: number) => {
                  // Check if it's a group with sections or individual fancy
                  const fancyItems = fancyGroup.section || [fancyGroup];
                  
                  return (
                    <div key={groupIdx} className="space-y-2">
                      {fancyGroup.mname && (
                        <div className={cn(
                          "bg-slate-600 text-white font-medium flex items-center justify-between",
                          isMobile ? "px-2 py-1 text-xs" : "px-4 py-1.5 text-sm"
                        )}>
                          <span>{fancyGroup.mname}</span>
                          {fancyGroup.mid && !isMobile && <span className="text-xs opacity-80">Market ID: {fancyGroup.mid}</span>}
                        </div>
                      )}
                      
                      <div className="overflow-x-auto">
                        <Table className="border">
                          <TableHeader>
                            <TableRow className="bg-muted">
                              <TableHead className={cn(
                                "font-semibold text-foreground sticky left-0 bg-muted z-10",
                                isMobile ? "min-w-[100px] text-xs" : "min-w-[180px] text-sm"
                              )}>
                                Selection
                              </TableHead>
                              {!isMobile && <TableHead className="text-center text-xs text-muted-foreground w-20">Line</TableHead>}
                              <TableHead className={cn("text-center font-semibold bg-pink-600 text-white", isMobile ? "text-xs w-16" : "text-sm w-24")}>No</TableHead>
                              <TableHead className={cn("text-center font-semibold bg-blue-600 text-white", isMobile ? "text-xs w-16" : "text-sm w-24")}>Yes</TableHead>
                              {!isMobile && <TableHead className="text-center text-xs text-muted-foreground w-20">Min/Max</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fancyItems.map((fancy: any, idx: number) => (
                              <TableRow key={idx} className="hover:bg-muted/50">
                                <TableCell className={cn(
                                  "font-medium text-foreground sticky left-0 bg-background z-10",
                                  isMobile ? "p-2 text-xs" : "p-3 text-sm"
                                )}>
                                  {fancy.gstatus === 'SUSPENDED' ? (
                                    <span className="text-destructive font-semibold">SUSP</span>
                                  ) : (
                                    fancy.nat || fancy.name || `Fancy ${idx + 1}`
                                  )}
                                  {fancy.sid && !isMobile && <span className="text-xs text-muted-foreground ml-2">(ID: {fancy.sid})</span>}
                                </TableCell>
                                {!isMobile && (
                                  <TableCell className="text-center text-sm font-semibold text-foreground">
                                    {fancy.line || '-'}
                                  </TableCell>
                                )}
                                {renderOddsCell(fancy.nat || fancy.name, 'lay', fancy.l1, fancy.ls1, `fancy-${groupIdx}-${idx}`, fancy.gstatus === 'SUSPENDED')}
                                {renderOddsCell(fancy.nat || fancy.name, 'back', fancy.b1, fancy.bs1, `fancy-${groupIdx}-${idx}`, fancy.gstatus === 'SUSPENDED')}
                                {!isMobile && (
                                  <TableCell className="text-center text-xs text-muted-foreground">
                                    {fancy.min && fancy.max ? `${fancy.min}-${fancy.max}` : '-'}
                                  </TableCell>
                                )}
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
