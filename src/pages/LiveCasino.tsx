import { useState } from "react";
import Navigation from "@/components/Navigation";
import { TableCard } from "@/components/live-casino/TableCard";
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

const LiveCasino = () => {
  const {
    liveTables,
    selectedTable,
    odds,
    bets,
    loading,
    streamUrls,
    resultHistory,
    currentResult,
    fetchTableDetails,
    fetchOdds,
    placeBet,
    setSelectedTable,
    fetchStreamUrl,
    fetchCurrentResult,
    fetchResultHistory
  } = useDiamondCasino();

  const [viewMode, setViewMode] = useState<'tables' | 'betting'>('tables');
  const [streamUrl, setStreamUrl] = useState<string>();

  const handleSelectTable = async (table: any) => {
    setSelectedTable(table);
    setViewMode('betting');
    
    // Fetch all data in parallel
    await Promise.all([
      fetchTableDetails(table.id),
      fetchOdds(table.id),
      fetchStreamUrl(table.id).then(url => setStreamUrl(url)),
      fetchCurrentResult(table.id),
      fetchResultHistory(table.id)
    ]);
  };

  const handleBack = () => {
    setViewMode('tables');
    setSelectedTable(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 overflow-x-hidden">
      <Navigation />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 mt-2 sm:mt-2">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          {viewMode === 'betting' && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tables
            </Button>
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                🎰 Live Casino
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Powered by Diamond Casino • Real-time gaming tables
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && liveTables.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading tables...</span>
            </CardContent>
          </Card>
        )}

        {/* Tables View */}
        {viewMode === 'tables' && !loading && liveTables.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No live tables available at the moment. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}

        {viewMode === 'tables' && liveTables.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 md:gap-6">
            {liveTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => handleSelectTable(table)}
              />
            ))}
          </div>
        )}

        {/* Betting View */}
        {viewMode === 'betting' && selectedTable && (
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
                    tableId={selectedTable.id} 
                    tableName={selectedTable.name}
                  />

                  {/* Current Result */}
                  {currentResult && (
                    <CurrentResult 
                      result={currentResult}
                      tableName={selectedTable.name}
                    />
                  )}

                  {/* Odds Display */}
                  {odds && <OddsDisplay odds={odds} />}

                  {/* Betting Panel */}
                  <BettingPanel
                    table={selectedTable}
                    odds={odds}
                    onPlaceBet={placeBet}
                    loading={loading}
                  />
                </div>

                {/* Sidebar - Result History */}
                <div className="lg:col-span-1">
                  <ResultHistory 
                    results={resultHistory}
                    tableId={selectedTable.id}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="results">
              <ResultHistory 
                results={resultHistory}
                tableId={selectedTable.id}
              />
            </TabsContent>

            <TabsContent value="history">
              <BetHistory bets={bets} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default LiveCasino;
