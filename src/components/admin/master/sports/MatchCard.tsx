import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Activity, 
  Calendar, 
  DollarSign, 
  Eye, 
  Trophy,
  TrendingUp,
  Users,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MatchCardProps {
  match: any;
  onToggleBetting: (matchId: string, enabled: boolean) => void;
  onViewDetails: (match: any) => void;
  onViewOdds: (matchId: string) => void;
  onPostResult: (match: any) => void;
}

export const MatchCard = ({ 
  match, 
  onToggleBetting, 
  onViewDetails, 
  onViewOdds,
  onPostResult 
}: MatchCardProps) => {
  const isLive = match.status === 'live' || match.isLive;
  const hasOdds = match.odds || match.hasOdds;
  
  const getStatusColor = () => {
    if (isLive) return 'bg-green-500';
    if (match.status === 'completed') return 'bg-gray-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (isLive) return 'LIVE';
    if (match.status === 'completed') return 'Completed';
    if (match.status === 'upcoming') return 'Upcoming';
    return match.status || 'Unknown';
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`} />
            <div>
              <h3 className="font-semibold text-lg">
                {match.homeTeam || match.team1 || 'Team A'} vs {match.awayTeam || match.team2 || 'Team B'}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {match.sport || match.sportType || 'Sports'}
                </Badge>
                {match.league && (
                  <Badge variant="outline" className="text-xs">
                    {match.league}
                  </Badge>
                )}
                <Badge 
                  variant={isLive ? "default" : "outline"} 
                  className={`text-xs ${isLive ? 'bg-green-500' : ''}`}
                >
                  {getStatusText()}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(match)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {hasOdds && (
                <DropdownMenuItem onClick={() => onViewOdds(match.id || match.eventId)}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Odds
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onPostResult(match)}>
                <Trophy className="h-4 w-4 mr-2" />
                Post Result
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Match Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(match.date || match.startTime || Date.now()).toLocaleString()}</span>
          </div>
          {match.venue && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>{match.venue}</span>
            </div>
          )}
        </div>

        {/* Score if available */}
        {(match.score || match.currentScore) && (
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="text-center text-2xl font-bold">
              {match.score || match.currentScore || '0 - 0'}
            </div>
          </div>
        )}

        {/* Betting Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Total Bets</div>
            <div className="font-semibold">{match.totalBets || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Pool</div>
            <div className="font-semibold">₹{match.totalPool || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Users</div>
            <div className="font-semibold">{match.activeUsers || 0}</div>
          </div>
        </div>

        {/* Betting Toggle */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Betting</span>
          </div>
          <Switch
            checked={match.bettingEnabled}
            onCheckedChange={(checked) => onToggleBetting(match.id || match.eventId, checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};