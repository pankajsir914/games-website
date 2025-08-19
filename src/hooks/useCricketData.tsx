import { useState, useEffect, useCallback } from 'react';
import { SportsMatch } from './useSportsData';

const CRICAPI_BASE_URL = 'https://api.cricapi.com/v1';
const CRICAPI_KEY = 'a4cd2ec0-4175-4263-868a-22ef5cbd9316';

interface CricAPIMatch {
  id: string;
  name: string;
  status: string;
  venue: string;
  date: string;
  dateTimeGMT: string;
  teams: string[];
  teamInfo: Array<{
    name: string;
    shortname: string;
    img: string;
  }>;
  score: Array<{
    r: number;
    w: number;
    o: number;
    inning: string;
  }>;
  series_id: string;
  fantasyEnabled: boolean;
  bbbEnabled: boolean;
  hasSquad: boolean;
  matchType: string;
}

interface CricAPIResponse {
  apikey: string;
  data: CricAPIMatch[];
  status: string;
  info: {
    hitsToday: number;
    hitsUsed: number;
    hitsLimit: number;
    credits: number;
    server: number;
    offsetRows: number;
    totalRows: number;
    queryTime: number;
    s: number;
    cache: number;
  };
}

function transformCricAPIMatch(match: CricAPIMatch): SportsMatch {
  const homeTeam = match.teamInfo?.[0]?.name || match.teams?.[0] || 'Team A';
  const awayTeam = match.teamInfo?.[1]?.name || match.teams?.[1] || 'Team B';
  
  // Extract scores - assuming first score is home team, second is away team
  const homeScore = match.score?.[0];
  const awayScore = match.score?.[1];
  
  return {
    id: match.id,
    sport: 'cricket',
    date: match.dateTimeGMT || match.date,
    league: match.name.split(' vs ')[0]?.split(' ')[0] || 'Cricket Match',
    venue: match.venue,
    status: match.status,
    teams: {
      home: homeTeam,
      away: awayTeam
    },
    scores: {
      home: homeScore?.r || null,
      away: awayScore?.r || null
    },
    overs: homeScore && awayScore ? {
      home: homeScore.o?.toString() || '0',
      away: awayScore.o?.toString() || '0'
    } : undefined,
    wickets: homeScore && awayScore ? {
      home: homeScore.w || 0,
      away: awayScore.w || 0
    } : undefined,
    raw: match
  };
}

export function useCricketData(matchType: 'live' | 'upcoming' | 'results') {
  const [data, setData] = useState<SportsMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (matchType !== 'live') {
      // For now, only fetch live matches from CricAPI
      // You can extend this to handle upcoming and completed matches
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${CRICAPI_BASE_URL}/currentMatches?apikey=${CRICAPI_KEY}&offset=0`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: CricAPIResponse = await response.json();
      
      if (result.status !== 'success') {
        throw new Error('Failed to fetch cricket data from API');
      }
      
      const matches = result.data.map(transformCricAPIMatch);
      setData(matches);
      setLastRefresh(new Date());
      
    } catch (err: any) {
      console.error('Cricket API Error:', err);
      setError(err.message || 'Failed to fetch cricket data');
      
      // Fallback to sample data on error
      const sampleMatch: SportsMatch = {
        id: 'sample-cricket-1',
        sport: 'cricket',
        date: new Date().toISOString(),
        league: 'Live Cricket Match',
        venue: 'Cricket Stadium',
        status: 'Live',
        teams: {
          home: 'India',
          away: 'Australia'
        },
        scores: {
          home: 156,
          away: 134
        },
        overs: {
          home: '20.0',
          away: '18.3'
        },
        wickets: {
          home: 4,
          away: 6
        },
        commentary: ['Great batting display', 'Excellent bowling performance'],
        raw: {}
      };
      setData([sampleMatch]);
    } finally {
      setLoading(false);
    }
  }, [matchType]);

  const refresh = () => fetchData(true);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh, lastRefresh };
}