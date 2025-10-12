import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface CurrentResultProps {
  result: any;
  tableName: string;
}

export const CurrentResult = ({ result, tableName }: CurrentResultProps) => {
  if (!result) {
    return null;
  }

  return (
    <Card className="border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-amber-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Latest Result - {tableName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Round #{result.mid || result.roundId || 'Current'}
            </p>
            <p className="text-2xl font-bold mt-1">
              {result.result || result.winner || result.nat || 'In Progress'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{result.status || 'Live'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
