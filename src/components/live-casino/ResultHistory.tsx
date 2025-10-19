import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";

interface ResultHistoryProps {
  results: any[];
  tableId: string;
}

export const ResultHistory = ({ results, tableId }: ResultHistoryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <History className="h-4 w-4 sm:h-5 sm:w-5" />
          Recent Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] sm:h-[300px]">
          <div className="space-y-1.5 sm:space-y-2">
            {!results || results.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No results yet
              </p>
            ) : (
              results.map((result: any, index: number) => {
                const winnerDisplay = result.win === "1" ? "Player A" : result.win === "2" ? "Player B" : `Winner ${result.win}`;
                
                return (
                  <div 
                    key={index} 
                    className="flex justify-between items-center p-2 sm:p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-sm sm:text-base">
                        Round #{result.mid || index + 1}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Winner: {winnerDisplay}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-base sm:text-lg text-primary">
                        {winnerDisplay}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
