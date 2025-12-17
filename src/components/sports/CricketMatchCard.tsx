import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Trophy, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

interface CricketMatchCardProps {
  match: any;
}

export function CricketMatchCard({ match }: CricketMatchCardProps) {
  const navigate = useNavigate();
  const isLive = match.status === "Live" || match.status === "live";
  const isCompleted = match.status === "completed" || match.status === "Completed" || match.status === "finished";

  const formatCricketScore = (runs: number | null, wickets: number | null, overs: string | null) => {
    if (runs === null || runs === undefined) return "-";
    
    let scoreStr = `${runs}`;
    if (wickets !== null && wickets !== undefined) {
      scoreStr += `/${wickets}`;
    }
    if (overs && overs !== "0") {
      scoreStr += ` (${overs})`;
    }
    return scoreStr;
  };

  const calculateRunRate = (runs: number | null, overs: string | null) => {
    if (!runs || !overs || overs === "0") return null;
    const oversFloat = parseFloat(overs);
    if (oversFloat === 0) return null;
    
    const ballsFaced = Math.floor(oversFloat) * 6 + (oversFloat % 1) * 10;
    const runRate = (runs / (ballsFaced / 6)).toFixed(2);
    return runRate;
  };

  const homeRunRate = calculateRunRate(match.scores?.home, match.overs?.home);
  const awayRunRate = calculateRunRate(match.scores?.away, match.overs?.away);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-secondary/5 border-primary/20">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-2 border-b border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium text-muted-foreground truncate max-w-[150px]">
              {match.league || "Cricket Match"}
            </span>
          </div>
          <Badge 
            variant={isLive ? "destructive" : isCompleted ? "secondary" : "outline"}
            className={`text-[10px] px-1.5 py-0 ${isLive ? "animate-pulse" : ""}`}
          >
            {match.status}
          </Badge>
        </div>

        {match.venue && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
            <MapPin className="h-2.5 w-2.5" />
            <span className="truncate">{match.venue}</span>
          </div>
        )}
      </div>

      {/* Compact Match Content */}
      <div className="p-2 space-y-2">
        {/* Teams and Scores */}
        <div className="space-y-1.5">
          {/* First Team */}
          <div className="flex items-center justify-between p-1.5 rounded bg-secondary/20 border border-secondary/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                  {match.teams?.home || "Team A"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">
                {formatCricketScore(match.scores?.home, match.wickets?.home, match.overs?.home)}
              </p>
              {homeRunRate && (
                <p className="text-[10px] text-muted-foreground">
                  RR: {homeRunRate}
                </p>
              )}
            </div>
          </div>

          {/* Second Team */}
          <div className="flex items-center justify-between p-1.5 rounded bg-secondary/20 border border-secondary/30">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary/50 flex items-center justify-center">
                <Users className="h-3 w-3 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                  {match.teams?.away || "Team B"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">
                {formatCricketScore(match.scores?.away, match.wickets?.away, match.overs?.away)}
              </p>
              {awayRunRate && (
                <p className="text-[10px] text-muted-foreground">
                  RR: {awayRunRate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Match Result for completed matches */}
        {isCompleted && match.raw?.result && (
          <div className="text-center p-1 bg-primary/10 rounded">
            <p className="text-[10px] font-semibold text-primary truncate">{match.raw.result}</p>
          </div>
        )}

        {/* Match Time */}
        {!isLive && !isCompleted && match.date && (
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{format(new Date(match.date), "MMM d, h:mm a")}</span>
          </div>
        )}

        {/* Action Button */}
        <Button
          size="sm"
          className="w-full h-7 text-xs bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          onClick={() => navigate(`/match/${match.id}`, { state: { match, sport: 'cricket' } })}
        >
          {isLive ? "Live" : isCompleted ? "Scorecard" : "Details"}
        </Button>
      </div>
    </Card>
  );
}