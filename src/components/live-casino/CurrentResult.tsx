import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface CurrentResultProps {
  result: any;
  tableName: string;
  tableId?: string;
}

export const CurrentResult = ({ result, tableName, tableId }: CurrentResultProps) => {
  const [selectedResult, setSelectedResult] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  if (!result || !result.latestResult) {
    return null;
  }

  // Get last 10 results from API response
  const allResults = result.results || [];
  const last10Results = allResults.slice(0, 10); // API returns latest first, so take first 10

  const fetchDetailResult = async (mid: string | number) => {
    if (!tableId || !mid) {
      console.error("Missing tableId or mid:", { tableId, mid });
      return;
    }
    
    setLoading(true);
    setDetailData(null);
    
    try {
      console.log("🔍 Fetching detail result:", { tableId, mid });
      
      const { data, error } = await supabase.functions.invoke("diamond-casino-proxy", {
        body: { 
          action: "get-detail-result", 
          tableId,
          mid: String(mid)
        }
      });

      console.log("📥 Detail result response:", { data, error });

      if (error) {
        console.error("❌ Error fetching detail result:", error);
        setDetailData({ error: error.message || "Failed to fetch detail result" });
      } else if (data) {
        // Check if data has success field
        if (data.success === false) {
          console.error("❌ API returned error:", data.error);
          setDetailData({ error: data.error || "No data available" });
        } else {
          const resultData = data?.data || data;
          console.log("✅ Detail data set:", resultData);
          setDetailData(resultData);
        }
      } else {
        console.warn("⚠️ No data in response");
        setDetailData({ error: "No data received from API" });
      }
    } catch (error) {
      console.error("❌ Exception fetching detail result:", error);
      setDetailData({ error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (res: any) => {
    const mid = res.mid || res.round || res.round_id;
    if (mid) {
      setSelectedResult(res);
      setDialogOpen(true);
      setDetailData(null);
      fetchDetailResult(mid);
    }
  };

  return (
    <Card className="border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-amber-500/10">
      <CardContent className="p-4 space-y-3">
        {/* Last 10 Results - Horizontal Scroll */}
        {last10Results.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">
              Last 10 Results
            </p>
            <div className="overflow-x-auto">
              <div className="flex gap-1.5 pb-2">
                {last10Results.map((res: any, index: number) => {
                  const resWin = res.win || res.winner || res.result || "N/A";
                  
                  return (
                    <Button
                      key={res.mid || index}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 w-10 h-10 p-0 flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors"
                      onClick={() => handleResultClick(res)}
                    >
                      <span className="text-xs font-bold">
                        {resWin}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Detail Result Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Round #{selectedResult?.mid || selectedResult?.round || "N/A"} - Detailed Result
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2">Loading details...</span>
                    </div>
                  ) : detailData ? (
                    <div className="space-y-4">
                      {detailData.error ? (
                        <div className="text-center py-8">
                          <p className="text-destructive font-medium mb-2">Error</p>
                          <p className="text-sm text-muted-foreground">{detailData.error}</p>
                          <p className="text-xs text-muted-foreground mt-4">
                            Check console for more details
                          </p>
                        </div>
                      ) : (() => {
                        // Extract t1 data from the response
                        const t1Data = detailData?.data?.t1 || detailData?.t1 || null;
                        
                        if (!t1Data) {
                          return (
                            <div className="text-center py-8 text-muted-foreground">
                              No detailed result data available
                            </div>
                          );
                        }

                        // Parse rdesc to extract winner and one or more bet results
                        const parseRdesc = (rdesc: string) => {
                          if (!rdesc) {
                            return {
                              winner: null,
                              results: [] as { betOption: string | null; result: string | null }[],
                              fullText: null
                            };
                          }

                          // Expected pattern (can contain multiple results for same round):
                          // "Winner#B : Over 21(32)#A : Under 21(10)"
                          //  - Winner  = text before first '#'
                          //  - Each part after that = "BetCode : Result"
                          const parts = rdesc.split('#').map((p) => p.trim()).filter(Boolean);

                          if (parts.length === 0) {
                            return {
                              winner: null,
                              results: [],
                              fullText: rdesc
                            };
                          }

                          const winner = parts[0];

                          const results = parts.slice(1).map((segment) => {
                            // Segment like "B : Over 21(32)" or "B:Over 21(32)"
                            const colonIndex = segment.indexOf(':');
                            if (colonIndex === -1) {
                              return {
                                betOption: segment.trim(),
                                result: null
                              };
                            }

                            const betOption = segment.substring(0, colonIndex).trim();
                            const result = segment.substring(colonIndex + 1).trim();

                            return { betOption, result };
                          });

                          return {
                            winner: winner || null,
                            results,
                            fullText: rdesc
                          };
                        };

                        // Format cards for display
                        const formatCards = (cardString: string) => {
                          if (!cardString) return [];
                          return cardString.split(',').map(card => card.trim());
                        };

                        const cards = formatCards(t1Data.card || '');
                        const parsedRdesc = parseRdesc(t1Data.rdesc || '');

                        return (
                          <div className="space-y-6">
                            {/* Winner Section - Highlighted */}
                            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500/50 rounded-lg p-4">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Winner</p>
                                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {parsedRdesc.winner || t1Data.winnat || 'N/A'}
                                  </p>
                                </div>
                                
                                {/* Multiple bet results for same round, parsed from rdesc */}
                                {parsedRdesc.results && parsedRdesc.results.length > 0 && (
                                  <div className="pt-2 border-t border-green-500/30 space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground">
                                      Round Results
                                    </p>
                                    <div className="space-y-1">
                                      {parsedRdesc.results.map((res, idx) => (
                                        <div
                                          key={idx}
                                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-md bg-green-500/10 px-2 py-1.5"
                                        >
                                          <span className="text-xs font-medium text-green-700 dark:text-green-200">
                                            Bet:{" "}
                                            <span className="font-semibold">
                                              {res.betOption || "N/A"}
                                            </span>
                                          </span>
                                          {res.result && (
                                            <span className="text-xs text-green-800 dark:text-green-100">
                                              Result:{" "}
                                              <span className="font-medium">
                                                {res.result}
                                              </span>
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="pt-2 border-t border-green-500/30">
                                  <p className="text-xs text-muted-foreground mb-1">Win Code</p>
                                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {t1Data.win || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Game Information */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground">Event Name</p>
                                <p className="text-sm font-medium">{t1Data.ename || 'N/A'}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground">Round ID</p>
                                <p className="text-sm font-medium font-mono">{t1Data.rid || 'N/A'}</p>
                              </div>
                              <div className="space-y-1 col-span-2">
                                <p className="text-xs font-semibold text-muted-foreground">Round Description</p>
                                <p className="text-sm font-medium break-words">{parsedRdesc.fullText || t1Data.rdesc || 'N/A'}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground">Time</p>
                                <p className="text-sm font-medium">{t1Data.mtime || 'N/A'}</p>
                              </div>
                            </div>

                            {/* Cards Display */}
                            {cards.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground">Cards</p>
                                <div className="flex flex-wrap gap-2">
                                  {cards.map((card, index) => (
                                    <div
                                      key={index}
                                      className="px-3 py-2 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border border-red-300 dark:border-red-700 rounded-md font-mono font-bold text-sm text-red-700 dark:text-red-300"
                                    >
                                      {card}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No detailed data available
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
