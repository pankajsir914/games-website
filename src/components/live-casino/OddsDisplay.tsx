import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface OddsDisplayProps {
  odds: any;
}

export const OddsDisplay = ({ odds }: OddsDisplayProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!odds) {
    return (
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <CardTitle className="text-base sm:text-lg flex items-center justify-between">
            <span>Current Odds</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <p className="text-sm text-muted-foreground">Loading odds...</p>
          </CardContent>
        )}
      </Card>
    );
  }

  const oddsArray = odds.bets || [];

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-base sm:text-lg flex items-center justify-between">
          <span>Current Odds {oddsArray.length > 0 && <span className="text-sm text-muted-foreground font-normal">({oddsArray.length})</span>}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
          {oddsArray.length === 0 ? (
            <p className="text-sm text-muted-foreground">No odds available</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
              {oddsArray.map((bet: any, idx: number) => {
                // Format odds properly - convert to decimal if needed
                const formatOdds = (oddsValue: any) => {
                  if (!oddsValue || oddsValue === 0) return '0.00';
                  
                  const num = Number(oddsValue);
                  
                  // If odds is very large (like 300000), it might be in points format
                  // Convert to decimal odds (divide by 100000 or appropriate factor)
                  if (num > 1000) {
                    // Likely points format - convert to decimal
                    const decimal = num / 100000;
                    return decimal > 0 ? decimal.toFixed(2) : '0.00';
                  }
                  
                  // Already in decimal format, just format to 2 decimal places
                  return num > 0 ? num.toFixed(2) : '0.00';
                };
                
                const backVal = bet?.back ?? bet?.odds ?? 0;
                const layVal = bet?.lay ?? 0;
                const displayOdds = backVal > 0 ? backVal : (layVal > 0 ? layVal : bet?.odds ?? 0);
                
                return (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-secondary/50"
                  >
                    <span className="text-xs sm:text-sm font-medium">{bet.type || 'Bet'}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {formatOdds(displayOdds)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};
