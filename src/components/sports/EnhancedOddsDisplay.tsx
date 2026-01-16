import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface EnhancedOddsDisplayProps {
  odds: any;
  onSelectBet: (selection: any, type: 'back' | 'lay' | 'yes' | 'no', rate: number, marketType: string, mname?: string) => void;
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

  // Helper function to check if a team/selection has valid odds
  const hasValidOdds = (item: any): boolean => {
    if (!item) return false;
    // Check for back odds (b1, b2, b3, b, back)
    const hasBack = !!(item.b1 || item.b2 || item.b3 || item.b || item.back || item.odds);
    // Check for lay odds (l1, l2, l3, l, lay)
    const hasLay = !!(item.l1 || item.l2 || item.l3 || item.l || item.lay);
    // Check for rate (for session markets)
    const hasRate = !!(item.rate || item.rate_yes || item.rate_no);
    return hasBack || hasLay || hasRate;
  };

  // Helper function to check if a market has valid data
  const marketHasValidData = (market: any): boolean => {
    if (!market) return false;
    // Check if market has sections with valid odds
    if (market.section && Array.isArray(market.section)) {
      return market.section.some((item: any) => hasValidOdds(item));
    }
    // Check if market itself has odds (for single-item markets)
    return hasValidOdds(market);
  };

  // Filter markets to only show those with valid odds data
  const filteredMatchMarkets = matchMarkets.filter(marketHasValidData);
  const filteredFancyMarkets = fancyMarkets.filter(marketHasValidData);
  const filteredBookmakerMarkets = bookmakerMarkets.filter(marketHasValidData);

  // Render odds cell with proper styling
  const renderOddsCell = (
    selection: string,
    type: 'back' | 'lay',
    rate: string | number | null,
    size: string | number | null,
    marketType: string,
    isSuspended: boolean = false,
    mname?: string
  ) => {
    if (!rate || isSuspended) {
      return (
        <TableCell className={cn(
          "text-center cursor-not-allowed",
          isMobile ? "p-0.5 min-h-[35px] min-w-[42px]" : "p-2 min-h-[44px] min-w-[80px]",
          type === 'back' ? "bg-blue-100" : "bg-pink-100"
        )}>
          <span className={cn("text-destructive font-semibold", isMobile ? "text-[9px]" : "text-sm")}>-</span>
        </TableCell>
      );
    }

    const isSelected = selectedBet?.selection === selection && 
                      selectedBet?.type === type && 
                      selectedBet?.marketType === marketType;

    return (
      <TableCell 
        className={cn(
          "text-center cursor-pointer transition-opacity",
          isMobile ? "p-0.5 min-h-[35px] min-w-[42px] active:opacity-70" : "p-2 min-h-[44px] min-w-[80px] hover:opacity-80",
          type === 'back' ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-pink-500 hover:bg-pink-600 text-white",
          isSelected && "ring-1 ring-yellow-400 ring-inset"
        )}
        onClick={() => !isSuspended && onSelectBet(selection, type, parseFloat(rate.toString()), marketType, mname)}
      >
        <div className="flex flex-col items-center justify-center">
          <span className={cn("font-bold leading-tight", isMobile ? "text-[10px]" : "text-base")}>
            {parseFloat(rate.toString()).toFixed(2)}
          </span>
          {size && (
            <span className={cn("opacity-80 leading-tight", isMobile ? "text-[8px] mt-0" : "text-xs mt-1")}>
              {size}
            </span>
          )}
        </div>
      </TableCell>
    );
  };

  return (
    <Card>
      <CardContent className={cn("p-2 sm:p-4")}>
        <ScrollArea className="w-full">
          <div className={cn("space-y-4 sm:space-y-6")}>
            {/* Match Odds Section */}
            {filteredMatchMarkets.length > 0 && filteredMatchMarkets.map((market: any, marketIdx: number) => {
              // Filter sections to only show those with valid odds
              const validSections = (market.section || []).filter((team: any) => hasValidOdds(team));
              if (validSections.length === 0) return null;
              
              return (
              <div key={marketIdx} className="space-y-2">
                <div className={cn(
                  "bg-slate-700 text-white rounded-t font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0",
                  isMobile ? "px-1.5 py-1 text-[10px]" : "px-4 py-2 text-sm"
                )}>
                  <span className="break-words">
                    Match Odds {market.mname ? `- ${market.mname}` : ''}
                  </span>
                  {market.mid && (
                    <span className={cn("opacity-80 whitespace-nowrap", isMobile ? "text-[9px]" : "text-xs")}>
                      ID: {market.mid}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto -mx-1 sm:mx-0">
                  <div className="inline-block min-w-full px-1 sm:px-0">
                    <Table className="border min-w-full">
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead className={cn(
                            "font-semibold text-foreground sticky left-0 bg-muted z-20 border-r",
                            isMobile ? "min-w-[90px] text-[9px] sm:text-xs px-1.5" : "min-w-[150px] text-sm px-3"
                          )}>
                            Selection
                          </TableHead>
                          <TableHead className={cn(
                            "text-center text-muted-foreground",
                            isMobile ? "w-4 text-[8px] px-0.5" : "w-12 text-xs px-2"
                          )}></TableHead>
                          <TableHead className={cn(
                            "text-center text-muted-foreground",
                            isMobile ? "w-4 text-[8px] px-0.5" : "w-12 text-xs px-2"
                          )}></TableHead>
                          <TableHead className={cn(
                            "text-center text-muted-foreground",
                            isMobile ? "w-4 text-[8px] px-0.5" : "w-12 text-xs px-2"
                          )}></TableHead>
                          <TableHead className={cn(
                            "text-center font-semibold bg-blue-600 text-white",
                            isMobile ? "text-[9px] min-w-[42px] px-0.5" : "text-sm w-20 px-2"
                          )}>Back</TableHead>
                          <TableHead className={cn(
                            "text-center font-semibold bg-blue-600 text-white",
                            isMobile ? "text-[9px] min-w-[42px] px-0.5" : "text-sm w-20 px-2"
                          )}>Back</TableHead>
                          <TableHead className={cn(
                            "text-center font-semibold bg-blue-600 text-white",
                            isMobile ? "text-[9px] min-w-[42px] px-0.5" : "text-sm w-20 px-2"
                          )}>Back</TableHead>
                          <TableHead className={cn(
                            "text-center font-semibold bg-pink-600 text-white",
                            isMobile ? "text-[9px] min-w-[42px] px-0.5" : "text-sm w-20 px-2"
                          )}>Lay</TableHead>
                          <TableHead className={cn(
                            "text-center font-semibold bg-pink-600 text-white",
                            isMobile ? "text-[9px] min-w-[42px] px-0.5" : "text-sm w-20 px-2"
                          )}>Lay</TableHead>
                          <TableHead className={cn(
                            "text-center font-semibold bg-pink-600 text-white",
                            isMobile ? "text-[9px] min-w-[42px] px-0.5" : "text-sm w-20 px-2"
                          )}>Lay</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validSections.map((team: any, idx: number) => (
                          <TableRow key={idx} className="hover:bg-muted/50">
                            <TableCell className={cn(
                              "font-medium text-foreground sticky left-0 bg-background z-20 border-r shadow-[2px_0_4px_rgba(0,0,0,0.1)]",
                              isMobile ? "p-1.5 text-[11px] sm:text-xs min-w-[90px] max-w-[90px]" : "p-3 text-sm min-w-[150px]"
                            )}>
                              {team.gstatus === 'SUSPENDED' ? (
                                <span className="text-destructive font-semibold">SUSP</span>
                              ) : (
                                <span className="whitespace-normal break-words block">{team.nat || team.name || `Team ${idx + 1}`}</span>
                              )}
                            </TableCell>
                            <TableCell className={cn("bg-slate-50", isMobile ? "p-0.5" : "p-2")}></TableCell>
                            <TableCell className={cn("bg-slate-50", isMobile ? "p-0.5" : "p-2")}></TableCell>
                            <TableCell className={cn("bg-slate-50", isMobile ? "p-0.5" : "p-2")}></TableCell>
                            {renderOddsCell(team.nat || team.name, 'back', team.b1, team.bs1, `match-${marketIdx}`, team.gstatus === 'SUSPENDED', market.mname)}
                            {renderOddsCell(team.nat || team.name, 'back', team.b2, team.bs2, `match-${marketIdx}`, team.gstatus === 'SUSPENDED', market.mname)}
                            {renderOddsCell(team.nat || team.name, 'back', team.b3, team.bs3, `match-${marketIdx}`, team.gstatus === 'SUSPENDED', market.mname)}
                            {renderOddsCell(team.nat || team.name, 'lay', team.l1, team.ls1, `match-${marketIdx}`, team.gstatus === 'SUSPENDED', market.mname)}
                            {renderOddsCell(team.nat || team.name, 'lay', team.l2, team.ls2, `match-${marketIdx}`, team.gstatus === 'SUSPENDED', market.mname)}
                            {renderOddsCell(team.nat || team.name, 'lay', team.l3, team.ls3, `match-${marketIdx}`, team.gstatus === 'SUSPENDED', market.mname)}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              );
            })}

            {/* Bookmaker Section */}
            {filteredBookmakerMarkets.length > 0 && filteredBookmakerMarkets.map((bookmakerGroup: any, groupIdx: number) => {
              // Filter bookmaker items to only show those with valid odds
              const bookmakerItems = bookmakerGroup.section || (Array.isArray(bookmakerGroup) ? bookmakerGroup : [bookmakerGroup]);
              const validBookmakers = bookmakerItems.filter((item: any) => hasValidOdds(item));
              if (validBookmakers.length === 0) return null;
              
              return (
              <div key={groupIdx} className="space-y-2">
                <div className={cn(
                  "bg-slate-700 text-white font-semibold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0",
                  isMobile ? "px-1.5 py-1 text-[10px]" : "px-4 py-2 text-sm"
                )}>
                  <span className="break-words">
                    Bookmaker {bookmakerGroup.mname ? `- ${bookmakerGroup.mname}` : ''}
                  </span>
                  {bookmakerGroup.mid && (
                    <span className={cn("opacity-80 whitespace-nowrap", isMobile ? "text-[9px]" : "text-xs")}>
                      ID: {bookmakerGroup.mid}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto -mx-1 sm:mx-0">
                  <div className="inline-block min-w-full px-1 sm:px-0">
                    <Table className="border min-w-full">
                      <TableHeader>
                        <TableRow className="bg-muted">
                          <TableHead className={cn(
                            "font-semibold text-foreground sticky left-0 bg-muted z-20 border-r",
                            isMobile ? "min-w-[90px] text-[9px] sm:text-xs px-1.5" : "min-w-[150px] text-sm px-3"
                          )}>
                            Selection
                          </TableHead>
                          <TableHead className={cn("text-center font-semibold bg-blue-600 text-white", isMobile ? "text-[9px] min-w-[42px] px-0.5" : "text-sm w-24 px-2")}>Back</TableHead>
                          <TableHead className={cn("text-center font-semibold bg-pink-600 text-white", isMobile ? "text-[9px] min-w-[42px] px-0.5" : "text-sm w-24 px-2")}>Lay</TableHead>
                          <TableHead className={cn(
                            "text-center text-muted-foreground",
                            isMobile ? "text-[9px] min-w-[60px] px-0.5" : "text-xs w-20 px-2"
                          )}>Min/Max</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validBookmakers.map((bookmaker: any, idx: number) => (
                          <TableRow key={idx} className="hover:bg-muted/50">
                            <TableCell className={cn(
                              "font-medium text-foreground sticky left-0 bg-background z-20 border-r shadow-[2px_0_4px_rgba(0,0,0,0.1)]",
                              isMobile ? "p-1.5 text-[11px] sm:text-xs min-w-[90px] max-w-[90px]" : "p-3 text-sm min-w-[150px]"
                            )}>
                              {bookmaker.gstatus === 'SUSPENDED' ? (
                                <span className="text-destructive font-semibold">SUSP</span>
                              ) : (
                                <span className="whitespace-normal break-words block">{bookmaker.nat || bookmaker.name || `Selection ${idx + 1}`}</span>
                              )}
                            </TableCell>
                            {renderOddsCell(bookmaker.nat || bookmaker.name, 'back', bookmaker.b1, bookmaker.bs1, `bookmaker-${groupIdx}`, bookmaker.gstatus === 'SUSPENDED', bookmakerGroup.mname)}
                            {renderOddsCell(bookmaker.nat || bookmaker.name, 'lay', bookmaker.l1, bookmaker.ls1, `bookmaker-${groupIdx}`, bookmaker.gstatus === 'SUSPENDED', bookmakerGroup.mname)}
                            <TableCell className={cn(
                              "text-center text-muted-foreground",
                              isMobile ? "text-[9px] px-0.5" : "text-xs px-2"
                            )}>
                              {bookmaker.min && bookmaker.max ? `${bookmaker.min}-${bookmaker.max}` : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              );
            })}

            {/* Fancy Markets Section */}
            {filteredFancyMarkets.length > 0 && (
              <div className={cn("space-y-4", isMobile && "space-y-2")}>
                <div className={cn(
                  "bg-slate-700 text-white font-semibold",
                  isMobile ? "px-1.5 py-1 text-[10px]" : "px-4 py-2 text-sm"
                )}>
                  Fancy Markets
                </div>
                
                {/* Display all fancy markets with full details */}
                {filteredFancyMarkets.map((fancyGroup: any, groupIdx: number) => {
                  // Check if it's a group with sections or individual fancy
                  const fancyItems = fancyGroup.section || [fancyGroup];
                  // Filter to only show items with valid odds
                  const validFancyItems = fancyItems.filter((item: any) => hasValidOdds(item));
                  if (validFancyItems.length === 0) return null;
                  
                  return (
                    <div key={groupIdx} className="space-y-2">
                      {fancyGroup.mname && (
                        <div className={cn(
                          "bg-slate-600 text-white font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0",
                          isMobile ? "px-1.5 py-0.5 text-[10px]" : "px-4 py-1.5 text-sm"
                        )}>
                          <span className="break-words">{fancyGroup.mname}</span>
                          {fancyGroup.mid && (
                            <span className={cn("opacity-80 whitespace-nowrap", isMobile ? "text-[9px]" : "text-xs")}>
                              ID: {fancyGroup.mid}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="overflow-x-auto -mx-1 sm:mx-0">
                        <div className="inline-block min-w-full px-1 sm:px-0">
                          <Table className="border min-w-full">
                            <TableHeader>
                              <TableRow className="bg-muted">
                                <TableHead className={cn(
                                  "font-semibold text-foreground sticky left-0 bg-muted z-20 border-r",
                                  isMobile ? "min-w-[90px] text-[9px] sm:text-xs px-1.5" : "min-w-[180px] text-sm px-3"
                                )}>
                                  Selection
                                </TableHead>
                                <TableHead className={cn(
                                  "text-center text-muted-foreground",
                                  isMobile ? "text-[9px] min-w-[45px] px-0.5" : "text-xs w-20 px-2"
                                )}>Line</TableHead>
                                <TableHead className={cn("text-center font-semibold bg-pink-600 text-white", isMobile ? "text-[9px] min-w-[42px] px-0.5" : "text-sm w-24 px-2")}>No</TableHead>
                                <TableHead className={cn("text-center font-semibold bg-blue-600 text-white", isMobile ? "text-[9px] min-w-[42px] px-0.5" : "text-sm w-24 px-2")}>Yes</TableHead>
                                <TableHead className={cn(
                                  "text-center text-muted-foreground",
                                  isMobile ? "text-[9px] min-w-[60px] px-0.5" : "text-xs w-20 px-2"
                                )}>Min/Max</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {validFancyItems.map((fancy: any, idx: number) => (
                                <TableRow key={idx} className="hover:bg-muted/50">
                                  <TableCell className={cn(
                                    "font-medium text-foreground sticky left-0 bg-background z-20 border-r shadow-[2px_0_4px_rgba(0,0,0,0.1)]",
                                    isMobile ? "p-1.5 text-[11px] sm:text-xs min-w-[90px] max-w-[90px]" : "p-3 text-sm min-w-[180px]"
                                  )}>
                                    {fancy.gstatus === 'SUSPENDED' ? (
                                      <span className="text-destructive font-semibold">SUSP</span>
                                    ) : (
                                      <span className="whitespace-normal break-words block">{fancy.nat || fancy.name || `Fancy ${idx + 1}`}</span>
                                    )}
                                  </TableCell>
                                  <TableCell className={cn(
                                    "text-center font-semibold text-foreground",
                                    isMobile ? "text-[9px] px-0.5" : "text-sm px-2"
                                  )}>
                                    {fancy.line || '-'}
                                  </TableCell>
                                  {renderOddsCell(fancy.nat || fancy.name, 'lay', fancy.l1, fancy.ls1, `fancy-${groupIdx}-${idx}`, fancy.gstatus === 'SUSPENDED', fancyGroup.mname)}
                                  {renderOddsCell(fancy.nat || fancy.name, 'back', fancy.b1, fancy.bs1, `fancy-${groupIdx}-${idx}`, fancy.gstatus === 'SUSPENDED', fancyGroup.mname)}
                                  <TableCell className={cn(
                                    "text-center text-muted-foreground",
                                    isMobile ? "text-[9px] px-0.5" : "text-xs px-2"
                                  )}>
                                    {fancy.min && fancy.max ? `${fancy.min}-${fancy.max}` : '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state if no markets */}
            {filteredMatchMarkets.length === 0 && filteredBookmakerMarkets.length === 0 && filteredFancyMarkets.length === 0 && (
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
