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
      scoreStr += ` (${overs} ov)`;
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
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-secondary/5 border-primary/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              {match.league || "Cricket Match"}
            </span>
          </div>
          <Badge 
            variant={isLive ? "destructive" : isCompleted ? "secondary" : "outline"}
            className={`${isLive ? "animate-pulse" : ""}`}
          >
            {match.status}
          </Badge>
        </div>

        {match.venue && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{match.venue}</span>
          </div>
        )}
      </div>

      {/* Match Content */}
      <div className="p-4 space-y-4">
        {/* Teams and Scores */}
        <div className="space-y-3">
          {/* First Innings / Batting Team */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{match.teams?.home || "Team A"}</p>
                {match.scores?.home !== null && (
                  <p className="text-xs text-muted-foreground">
                    {match.overs?.home && match.overs.home !== "0" ? "1st Innings" : "Yet to bat"}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">
                {formatCricketScore(match.scores?.home, match.wickets?.home, match.overs?.home)}
              </p>
              {homeRunRate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <TrendingUp className="h-3 w-3" />
                  RR: {homeRunRate}
                </p>
              )}
            </div>
          </div>

          {/* Second Innings / Bowling Team */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-secondary/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                <Users className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{match.teams?.away || "Team B"}</p>
                {match.scores?.away !== null && (
                  <p className="text-xs text-muted-foreground">
                    {match.overs?.away && match.overs.away !== "0" ? "2nd Innings" : "Yet to bat"}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">
                {formatCricketScore(match.scores?.away, match.wickets?.away, match.overs?.away)}
              </p>
              {awayRunRate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  <TrendingUp className="h-3 w-3" />
                  RR: {awayRunRate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Match Result for completed matches */}
        {isCompleted && match.raw?.result && (
          <div className="text-center p-2 bg-primary/10 rounded-lg">
            <p className="text-sm font-semibold text-primary">{match.raw.result}</p>
          </div>
        )}

        {/* Match Time */}
        {!isLive && !isCompleted && match.date && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{format(new Date(match.date), "PPp")}</span>
          </div>
        )}

        {/* Action Button */}
        <Button
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          onClick={() => navigate(`/match/${match.id}`, { state: { match, sport: 'cricket' } })}
        >
          {isLive ? "Watch Live" : isCompleted ? "View Scorecard" : "View Details"}
        </Button>
      </div>
    </Card>
  );
}