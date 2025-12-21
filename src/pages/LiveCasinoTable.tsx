import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { BettingPanel } from "@/components/live-casino/BettingPanel";
import { OddsDisplay } from "@/components/live-casino/OddsDisplay";
import { BetHistory } from "@/components/live-casino/BetHistory";
import { LiveStream } from "@/components/live-casino/LiveStream";
import { ResultHistory } from "@/components/live-casino/ResultHistory";
import { CurrentResult } from "@/components/live-casino/CurrentResult";
import { useDiamondCasino } from "@/hooks/useDiamondCasino";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LiveCasinoTable = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const {
    odds: initialOdds,
    bets,
    loading,
    resultHistory: initialResultHistory,
    currentResult: initialCurrentResult,
    fetchTableDetails,
    fetchOdds,
    placeBet,
    fetchStreamUrl,
    fetchCurrentResult,
    fetchResultHistory
  } = useDiamondCasino();

  const [tableData, setTableData] = useState<any>(null);
  const fetchingRef = useRef(false);
  
  // Real-time state from sockets
  const [odds, setOdds] = useState<any>(null);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [resultHistory, setResultHistory] = useState<any[]>([]);

  // Format odds data properly
  const formatOddsData = useCallback((rawOdds: any) => {
    if (!rawOdds) return null;

    // If already formatted, return as is
    if (rawOdds.bets && Array.isArray(rawOdds.bets)) {
      return rawOdds;
    }

    // Extract bets from raw data
    const payload = rawOdds?.data || rawOdds;
    let extractedBets: any[] = [];

    // Check if we have bets directly
    if (payload?.bets && Array.isArray(payload.bets)) {
      extractedBets = payload.bets
        .filter((bet: any) => {
          if (!bet) return false;
          const backVal = bet.back || bet.b1 || bet.b || bet.odds || 0;
          const layVal = bet.lay || bet.l1 || bet.l || 0;
          return (backVal > 0 || layVal > 0);
        })
        .map((bet: any) => {
          const betType = bet.type || bet.nat || bet.nation || bet.name || bet.label || 'Unknown';
          
          // Convert odds from points format to decimal format
          const convertToDecimal = (value: number): number => {
            if (!value || value === 0) return 0;
            // If value is very large (like 300000), it's in points format
            // Convert to decimal odds (divide by 100000)
            if (value > 1000) {
              return value / 100000;
            }
            // Already in decimal format
            return value;
          };
          
          const rawBackVal = bet.back || bet.b1 || bet.b || bet.odds || 0;
          const rawLayVal = bet.lay || bet.l1 || bet.l || 0;
          
          const backVal = convertToDecimal(Number(rawBackVal));
          const layVal = convertToDecimal(Number(rawLayVal));
          
          return {
            type: betType,
            odds: backVal > 0 ? backVal : (layVal > 0 ? layVal : 0),
            back: backVal || 0,
            lay: layVal || 0,
            status: bet.status || 'active',
            min: bet.min || 100,
            max: bet.max || 100000,
            sid: bet.sid,
            mid: bet.mid,
          };
        });
    }

    // If no bets extracted, try parsing from raw data
    if (extractedBets.length === 0 && payload?.raw) {
      const rawData = payload.raw;
      ["t1", "t2", "t3", "sub", "grp", "bets", "options", "markets"].forEach((key) => {
        if (rawData[key] && Array.isArray(rawData[key])) {
          rawData[key].forEach((item: any) => {
            if (!item || typeof item !== 'object') return;
            
            const betType = item.nat || item.nation || item.name || item.type || item.label || 'Unknown';
            
            // Convert odds from points format to decimal format
            const convertToDecimal = (value: number): number => {
              if (!value || value === 0) return 0;
              // If value is very large (like 300000), it's in points format
              // Convert to decimal odds (divide by 100000)
              if (value > 1000) {
                return value / 100000;
              }
              // Already in decimal format
              return value;
            };
            
            const rawBackVal = parseFloat(item.b1 || item.bs || item.b || item.back || item.odds || "0") || 0;
            const rawLayVal = parseFloat(item.l1 || item.ls || item.l || item.lay || "0") || 0;
            
            const backVal = convertToDecimal(rawBackVal);
            const layVal = convertToDecimal(rawLayVal);
            
            if (backVal > 0 || layVal > 0) {
              extractedBets.push({
                type: betType,
                odds: backVal > 0 ? backVal : layVal,
                back: backVal,
                lay: layVal,
                status: 'active',
                min: item.min || 100,
                max: item.max || 100000,
                sid: item.sid,
                mid: item.mid,
              });
            }
          });
        }
      });
    }

    return extractedBets.length > 0 
      ? { bets: extractedBets, rawData: payload || {} }
      : null;
  }, []);


  // Sync data from useDiamondCasino hook (updated via API polling)
  useEffect(() => {
    if (initialOdds) {
      console.log("🎯 LiveCasinoTable - Initial Odds Received:", {
        tableId,
        rawOdds: initialOdds,
        hasBets: initialOdds?.bets?.length > 0,
        betsCount: initialOdds?.bets?.length || 0
      });
      
      const formatted = formatOddsData(initialOdds);
      if (formatted) {
        console.log("✅ LiveCasinoTable - Formatted Odds:", {
          tableId,
          formattedOdds: formatted,
          betsCount: formatted.bets?.length || 0,
          sampleBets: formatted.bets?.slice(0, 3) || []
        });
        setOdds(formatted);
      } else {
        console.warn("⚠️ LiveCasinoTable - Failed to format odds:", initialOdds);
      }
    }
  }, [initialOdds, formatOddsData, tableId]);

  useEffect(() => {
    if (initialCurrentResult) {
      setCurrentResult(initialCurrentResult);
    }
  }, [initialCurrentResult]);

  useEffect(() => {
    if (initialResultHistory && initialResultHistory.length > 0) {
      setResultHistory(initialResultHistory);
    }
  }, [initialResultHistory]);

  useEffect(() => {
    if (!tableId) {
      navigate('/live-casino');
      return;
    }

    // Prevent duplicate concurrent fetches
    if (fetchingRef.current) {
      return;
    }

    // Fetch all table data based on tableId
    const fetchData = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        // Set basic table data from tableId
        const table = {
          id: tableId,
          name: tableId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          status: 'active',
        };
        setTableData(table);

        // Fetch initial data
        await Promise.allSettled([
          fetchTableDetails(tableId),
          fetchOdds(tableId),
          fetchStreamUrl(tableId),
          fetchCurrentResult(tableId),
          fetchResultHistory(tableId)
        ]);
      } catch (error) {
        console.error('Error fetching table data:', error);
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchData();

    // Set up polling for real-time updates (no sockets needed)
    const oddsInterval = setInterval(() => {
      fetchOdds(tableId, true); // silent = true
    }, 5000); // Every 5 seconds

    const resultInterval = setInterval(() => {
      fetchCurrentResult(tableId);
    }, 10000); // Every 10 seconds

    return () => {
      clearInterval(oddsInterval);
      clearInterval(resultInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, navigate]);

  const handleBack = () => {
    navigate('/live-casino');
  };

  if (!tableId || !tableData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
        <Navigation />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading table...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 overflow-x-hidden">
      <Navigation />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 mt-2 sm:mt-2">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tables
        </Button>

        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-3 sm:mb-6 h-8 sm:h-10 md:h-12">
            <TabsTrigger value="live" className="text-xs sm:text-sm">Live Game</TabsTrigger>
            <TabsTrigger value="results" className="text-xs sm:text-sm">Results</TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm">My Bets</TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-3 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
              {/* Main area - Stream + Betting */}
              <div className="lg:col-span-2 space-y-3 sm:space-y-6">
                {/* Live Stream */}
                <LiveStream 
                  tableId={tableId} 
                  tableName={tableData.name}
                />

                {/* Current Result */}
                {currentResult && (
                  <CurrentResult 
                    result={currentResult}
                    tableName={tableData.name}
                  />
                )}

                {/* Odds Display */}
                {odds && <OddsDisplay odds={odds} />}

                {/* Betting Panel */}
                <BettingPanel
                  table={tableData}
                  odds={odds}
                  onPlaceBet={placeBet}
                  loading={loading}
                />
              </div>

              {/* Sidebar - Result History */}
              <div className="lg:col-span-1">
                <ResultHistory 
                  results={resultHistory}
                  tableId={tableId}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results">
            <ResultHistory 
              results={resultHistory}
              tableId={tableId}
            />
          </TabsContent>

          <TabsContent value="history">
            <BetHistory bets={bets} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LiveCasinoTable;

