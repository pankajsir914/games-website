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
          <CardTitle className="text-lg">Current Odds</CardTitle>
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
        <CardTitle className="text-lg">Current Odds</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {oddsArray.length === 0 ? (
          <p className="text-sm text-muted-foreground">No odds available</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {oddsArray.map((bet: any, idx: number) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
              >
                <span className="text-sm font-medium">{bet.type || 'Bet'}</span>
                <Badge variant="outline" className="ml-2">
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
