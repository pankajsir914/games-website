// src/pages/LiveCasino.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { TableCard } from "@/components/live-casino/TableCard";
import { useDiamondCasino } from "@/hooks/useDiamondCasino";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const LiveCasino = () => {
  const navigate = useNavigate();
  const {
    liveTables,
    loading,
    fetchLiveTables
  } = useDiamondCasino();

  useEffect(() => {
    fetchLiveTables();
  }, [fetchLiveTables]);

  const handleSelectTable = (table: any) => {
    // Navigate to separate page for better UX
    // Benefits: Shareable URLs, browser back button, bookmarking, better for 80+ games
    navigate(`/live-casino/${table.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 overflow-x-hidden">
      <Navigation />
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 mt-2 sm:mt-2">
        {/* Header */}
        {/* <div className="mb-4 sm:mb-8">
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
        </div> */}

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
        {!loading && liveTables.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No live tables available at the moment. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}

        {liveTables.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-4 md:gap-6">
            {liveTables.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => handleSelectTable(table)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveCasino;
