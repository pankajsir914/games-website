import { useState, useEffect, useCallback } from 'react';
import { SportsMatch } from './useSportsData';

const CRICAPI_BASE_URL = 'https://api.cricapi.com/v1';
// 👇 Supabase proxy से key लाना चाहिए (hardcode मत करो)
const CRICAPI_KEY = import.meta.env.VITE_CRICAPI_KEY;

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

  // safer score extraction
  const homeScore = match.score?.find(s => s.inning?.includes(homeTeam)) || match.score?.[0];
  const awayScore = match.score?.find(s => s.inning?.includes(awayTeam)) || match.score?.[1];

  return {
    id: match.id,
    sport: 'cricket',
    date: match.dateTimeGMT || match.date,
    league: match.series_id || 'Cricket Match',
    venue: match.venue,
    status: match.status,
    teams: {
      home: homeTeam,
      away: awayTeam
    },
    scores: {
      home: homeScore?.r ?? null,
      away: awayScore?.r ?? null
    },
    overs: {
      home: homeScore?.o?.toString() ?? '0',
      away: awayScore?.o?.toString() ?? '0'
    },
    wickets: {
      home: homeScore?.w ?? 0,
      away: awayScore?.w ?? 0
    },
    raw: match
  };
}

export function useCricketData(matchType: 'live' | 'upcoming' | 'results') {
  const [data, setData] = useState<SportsMatch[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      if (matchType === 'live') {
        endpoint = `${CRICAPI_BASE_URL}/currentMatches?apikey=${CRICAPI_KEY}&offset=0`;
      } else if (matchType === 'upcoming') {
        endpoint = `${CRICAPI_BASE_URL}/matches?apikey=${CRICAPI_KEY}&offset=0`;
      } else if (matchType === 'results') {
        endpoint = `${CRICAPI_BASE_URL}/matches?apikey=${CRICAPI_KEY}&offset=0&status=completed`;
      }

      const response = await fetch(endpoint);
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
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [matchType]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData, lastRefresh };
}
