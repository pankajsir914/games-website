import { useEffect, useState, useRef } from "react";
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
    odds,
    bets,
    loading,
    resultHistory,
    currentResult,
    fetchTableDetails,
    fetchOdds,
    placeBet,
    fetchStreamUrl,
    fetchCurrentResult,
    fetchResultHistory
  } = useDiamondCasino();

  const [tableData, setTableData] = useState<any>(null);
  const fetchingRef = useRef(false);

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

        // Fetch all related data in parallel with error handling
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

    // Set up periodic odds fetching (every 15 seconds)
    const oddsInterval = setInterval(() => {
      fetchOdds(tableId);
    }, 15000);

    // Set up periodic result checking and bet processing (every 30 seconds)
    const resultInterval = setInterval(() => {
      fetchCurrentResult(tableId);
    }, 30000);

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

