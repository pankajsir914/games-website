import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface CurrentResultProps {
  result: any;
  tableName: string;
}

export const CurrentResult = ({ result, tableName }: CurrentResultProps) => {
  if (!result || !result.latestResult) {
    return null;
  }

  const latest = result.latestResult;
  const winnerDisplay = latest.win === "1" ? "Player A" : latest.win === "2" ? "Player B" : `Winner ${latest.win}`;

  return (
    <Card className="border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-amber-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          Latest Result - {result.tableName || tableName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Round #{latest.mid}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1">
              {winnerDisplay}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium text-green-500">Completed</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
