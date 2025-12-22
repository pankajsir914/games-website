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

  const [odds, setOdds] = useState<any>(null);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [resultHistory, setResultHistory] = useState<any[]>([]);

  const formatOddsData = useCallback((rawOdds: any) => {
    if (!rawOdds) return null;
    if (rawOdds.bets && Array.isArray(rawOdds.bets)) return rawOdds;

    const payload = rawOdds?.data || rawOdds;
    let extractedBets: any[] = [];

    if (payload?.bets && Array.isArray(payload.bets)) {
      extractedBets = payload.bets
        .filter((bet: any) => {
          const backVal = bet.back || bet.b1 || bet.b || bet.odds || 0;
          const layVal = bet.lay || bet.l1 || bet.l || 0;
          return backVal > 0 || layVal > 0;
        })
        .map((bet: any) => {
          const convert = (v: number) => (v > 1000 ? v / 100000 : v || 0);
          const back = convert(Number(bet.back || bet.b1 || bet.b || 0));
          const lay = convert(Number(bet.lay || bet.l1 || bet.l || 0));

          return {
            type: bet.type || bet.nation || "Unknown",
            odds: back || lay,
            back,
            lay,
            status: "active",
            min: bet.min || 100,
            max: bet.max || 100000,
            sid: bet.sid,
            mid: bet.mid
          };
        });
    }

    return extractedBets.length
      ? { bets: extractedBets, rawData: payload }
      : null;
  }, []);

  useEffect(() => {
    if (initialOdds) {
      const formatted = formatOddsData(initialOdds);
      if (formatted) setOdds(formatted);
    }
  }, [initialOdds, formatOddsData]);

  useEffect(() => {
    if (initialCurrentResult) setCurrentResult(initialCurrentResult);
  }, [initialCurrentResult]);

  useEffect(() => {
    if (initialResultHistory?.length) setResultHistory(initialResultHistory);
  }, [initialResultHistory]);

  useEffect(() => {
    if (!tableId || fetchingRef.current) return;

    const fetchData = async () => {
      fetchingRef.current = true;
      try {
        setTableData({
          id: tableId,
          name: tableId.replace(/-/g, " ").toUpperCase(),
          status: "active"
        });

        await Promise.allSettled([
          fetchTableDetails(tableId),
          fetchOdds(tableId),
          fetchStreamUrl(tableId),
          fetchCurrentResult(tableId),
          fetchResultHistory(tableId)
        ]);
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchData();

    const oddsInterval = setInterval(() => fetchOdds(tableId, true), 5000);
    const resultInterval = setInterval(() => fetchCurrentResult(tableId), 10000);

    return () => {
      clearInterval(oddsInterval);
      clearInterval(resultInterval);
    };
  }, [tableId]);

  if (!tableId || !tableData) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Card className="mx-4 mt-10">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading table…</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 py-4">
        {/* BACK BUTTON */}
        <Button
          variant="ghost"
          onClick={() => navigate("/live-casino")}
          className="mb-2 sm:mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Tabs defaultValue="live">
          <div className="mb-4 sm:mb-6 pt-2">
            <Card className="border-muted/40 shadow-sm">
              <TabsList
                className="
                  grid grid-cols-3
                  h-10 sm:h-11
                  p-1
                  bg-muted/40
                  rounded-md
                "
              >
                <TabsTrigger value="live" className="text-xs sm:text-sm">
                  Live
                </TabsTrigger>
                <TabsTrigger value="results" className="text-xs sm:text-sm">
                  Results
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs sm:text-sm">
                  My Bets
                </TabsTrigger>
              </TabsList>
            </Card>
          </div>

          {/* LIVE TAB */}
          <TabsContent value="live">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-5">
              {/* LEFT */}
              <div className="lg:col-span-2 space-y-3 md:space-y-5">
                <LiveStream tableId={tableId} tableName={tableData.name} />

                {currentResult && (
                  <CurrentResult
                    result={currentResult}
                    tableName={tableData.name}
                  />
                )}

                {odds && <OddsDisplay odds={odds} />}

                <BettingPanel
                  table={tableData}
                  odds={odds}
                  onPlaceBet={placeBet}
                  loading={loading}
                />
              </div>

              {/* RIGHT */}
              <div className="lg:col-span-1">
                <BetHistory bets={bets} />
              </div>
            </div>
          </TabsContent>

          {/* RESULTS */}
          <TabsContent value="results">
            <ResultHistory results={resultHistory} tableId={tableId} />
          </TabsContent>

          {/* MY BETS */}
          <TabsContent value="history">
            <BetHistory bets={bets} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LiveCasinoTable;
 
