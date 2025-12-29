import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { BetHistory } from "@/components/live-casino/BetHistory";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GameRules from "@/components/live-casino/GameRules";
import { useDiamondCasino } from "@/hooks/useDiamondCasino";
import { useCasinoResultSocket } from "@/hooks/useCasinoSocket";
import { resolveGameFamilyComponent } from "@/features/live-casino/config/gameFamilyRegistry";
import { LiveCasinoTableConfig } from "@/features/live-casino/types";

const buildTableConfig = (
  details: LiveCasinoTableConfig | null,
  tableId: string,
  streamUrl?: string | null
): LiveCasinoTableConfig => {
  const fallbackName = tableId.replace(/-/g, " ").toUpperCase();
  return {
    tableId,
    tableName: details?.tableName || fallbackName,
    gameFamily: (details?.gameFamily || "default").toLowerCase(),
    gameCode: details?.gameCode,
    provider: details?.provider,
    variant: details?.variant,
    min:
      details?.min !== undefined && details?.min !== null
        ? Number(details.min)
        : undefined,
    max:
      details?.max !== undefined && details?.max !== null
        ? Number(details.max)
        : undefined,
    status: details?.status || "active",
    streamUrl: streamUrl ?? details?.streamUrl ?? null,
    uiConfig: details?.uiConfig,
  };
};

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
    fetchResultHistory,
    streamUrls,
  } = useDiamondCasino();

  const [tableData, setTableData] = useState<LiveCasinoTableConfig | null>(null);
  const fetchingRef = useRef(false);

  const [odds, setOdds] = useState<any>(null);
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [resultHistory, setResultHistory] = useState<any[]>([]);

  // Real-time result updates via WebSocket + API polling
  useCasinoResultSocket(tableId, (result) => {
    if (result) {
      setCurrentResult({ ...result, _updated: Date.now() });
      if (result.results && Array.isArray(result.results)) {
        setResultHistory([...result.results]);
      }
    }
  });

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
            mid: bet.mid,
          };
        });
    }

    return extractedBets.length ? { bets: extractedBets, rawData: payload } : null;
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
        const [details, , stream] = await Promise.all([
          fetchTableDetails(tableId),
          fetchOdds(tableId),
          fetchStreamUrl(tableId),
          fetchCurrentResult(tableId),
          fetchResultHistory(tableId),
        ]);

        setTableData(buildTableConfig(details, tableId, stream));
      } finally {
        fetchingRef.current = false;
      }
    };

    fetchData();

    const oddsInterval = setInterval(() => {
      fetchOdds(tableId, true);
    }, 5000);

    return () => {
      clearInterval(oddsInterval);
    };
  }, [tableId, fetchOdds, fetchTableDetails, fetchStreamUrl, fetchCurrentResult, fetchResultHistory]);

  const streamUrlFromState = tableId ? streamUrls[tableId] : null;
  useEffect(() => {
    if (!tableId || !streamUrlFromState) return;
    setTableData((prev) =>
      prev ? { ...prev, streamUrl: streamUrlFromState } : prev
    );
  }, [tableId, streamUrlFromState]);

  const TemplateComponent = resolveGameFamilyComponent(tableData?.gameFamily);

  const handlePlaceBet = useCallback(
    async (betData: any) => {
      if (!tableData) return;
      await placeBet({
        ...betData,
        tableId: tableData.tableId,
        tableName: tableData.tableName,
      });
    },
    [placeBet, tableData]
  );

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
                <TabsTrigger value="history" className="text-xs sm:text-sm">
                  My Bets
                </TabsTrigger>
                <TabsTrigger value="gamerules" className="text-xs sm:text-sm">
                  Game Rules
                </TabsTrigger>
              </TabsList>
            </Card>
          </div>

          <TabsContent value="live">
            <TemplateComponent
              table={tableData}
              odds={odds}
              bets={bets}
              loading={loading}
              currentResult={currentResult}
              resultHistory={resultHistory}
              onPlaceBet={handlePlaceBet}
            />
          </TabsContent>

          <TabsContent value="history">
            <BetHistory bets={bets} />
          </TabsContent>

          <TabsContent value="gamerules">
            <GameRules tableId={tableId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LiveCasinoTable;
 
