import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OddsDisplayProps {
  odds: any;
}

export const OddsDisplay = ({ odds }: OddsDisplayProps) => {
  if (!odds) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Current Odds</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading odds...</p>
        </CardContent>
      </Card>
    );
  }

  const oddsArray = odds.bets || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Current Odds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {oddsArray.length === 0 ? (
          <p className="text-sm text-muted-foreground">No odds available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
            {oddsArray.map((bet: any, idx: number) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-secondary/50"
              >
                <span className="text-xs sm:text-sm font-medium">{bet.type || 'Bet'}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {bet.odds || '0.00'}x
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
