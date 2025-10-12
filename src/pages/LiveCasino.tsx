import { useState } from "react";
import Navigation from "@/components/Navigation";
import { TableCard } from "@/components/live-casino/TableCard";
import { BettingPanel } from "@/components/live-casino/BettingPanel";
import { OddsDisplay } from "@/components/live-casino/OddsDisplay";
import { BetHistory } from "@/components/live-casino/BetHistory";
import { useDiamondCasino } from "@/hooks/useDiamondCasino";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const LiveCasino = () => {
  const {
    liveTables,
    selectedTable,
    odds,
    bets,
    loading,
    fetchTableDetails,
    fetchOdds,
    placeBet,
    setSelectedTable
  } = useDiamondCasino();

  const [viewMode, setViewMode] = useState<'tables' | 'betting'>('tables');

  const handleSelectTable = async (table: any) => {
    setSelectedTable(table);
    setViewMode('betting');
    await fetchTableDetails(table.id);
    await fetchOdds(table.id);
  };

  const handleBack = () => {
    setViewMode('tables');
    setSelectedTable(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 mt-16">
        {/* Header */}
        <div className="mb-8">
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
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                🎰 Live Casino
              </h1>
              <p className="text-muted-foreground">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main betting area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Table info */}
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold mb-2">{selectedTable.name}</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Players: {selectedTable.players || 0}</span>
                    {selectedTable.data?.currentRound && (
                      <span>Round: #{selectedTable.data.currentRound}</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Odds display */}
              <OddsDisplay odds={odds} />

              {/* Betting panel */}
              <BettingPanel
                table={selectedTable}
                odds={odds}
                onPlaceBet={placeBet}
                loading={loading}
              />
            </div>

            {/* Bet history sidebar */}
            <div className="lg:col-span-1">
              <BetHistory bets={bets} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveCasino;
