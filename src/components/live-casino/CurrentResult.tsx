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
                      ) : (
                        <div>
                          <pre className="p-4 bg-muted rounded-md text-xs overflow-auto max-h-[60vh]">
                            {JSON.stringify(detailData, null, 2)}
                          </pre>
                        </div>
                      )}
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
