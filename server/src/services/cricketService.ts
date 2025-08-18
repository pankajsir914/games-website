import axios from 'axios';
import NodeCache from 'node-cache';
import { supabase } from '../config/supabase';

interface CricketMatch {
  id: string;
  name: string;
  matchType: string;
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
  score?: Array<{
    r: number;
    w: number;
    o: number;
    inning: string;
  }>;
  series_id: string;
  fantasyEnabled: boolean;
  bbbEnabled: boolean;
  hasSquad: boolean;
  matchStarted: boolean;
  matchEnded: boolean;
}

interface CricketPlayer {
  id: string;
  name: string;
  country: string;
  playerImg: string;
  stats?: any;
}

export class CricketService {
  private cache: NodeCache;
  private cricApiKey: string;
  private baseUrl: string = 'https://api.cricapi.com/v1';

  constructor() {
    this.cache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds
    this.cricApiKey = process.env.CRICAPI_KEY || 'a4cd2ec0-4175-4263-868a-22ef5cbd9316';
  }

  private async makeApiCall(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        params: {
          apikey: this.cricApiKey,
          offset: 0,
          ...params
        },
        timeout: 10000
      });

      if (response.data.status !== 'success' && response.data.data) {
        return response.data.data;
      }
      
      return response.data.data || response.data;
    } catch (error: any) {
      console.error(`CricAPI Error for ${endpoint}:`, error.message);
      throw new Error(`Failed to fetch ${endpoint}: ${error.message}`);
    }
  }

  async fetchLiveMatches(): Promise<CricketMatch[]> {
    const cacheKey = 'live-matches';
    let matches = this.cache.get<CricketMatch[]>(cacheKey);

    if (!matches) {
      try {
        matches = await this.makeApiCall('currentMatches');
        this.cache.set(cacheKey, matches);
      } catch (error) {
        console.error('Failed to fetch live matches:', error);
        return [];
      }
    }

    return matches || [];
  }

  async fetchUpcomingMatches(): Promise<CricketMatch[]> {
    const cacheKey = 'upcoming-matches';
    let matches = this.cache.get<CricketMatch[]>(cacheKey);

    if (!matches) {
      try {
        matches = await this.makeApiCall('matches');
        this.cache.set(cacheKey, matches);
      } catch (error) {
        console.error('Failed to fetch upcoming matches:', error);
        return [];
      }
    }

    return matches || [];
  }

  async fetchPlayerInfo(playerId: string): Promise<CricketPlayer | null> {
    const cacheKey = `player-${playerId}`;
    let player = this.cache.get<CricketPlayer>(cacheKey);

    if (!player) {
      try {
        const playerData = await this.makeApiCall(`players/${playerId}`);
        player = playerData;
        this.cache.set(cacheKey, player, 300); // Cache players for 5 minutes
      } catch (error) {
        console.error(`Failed to fetch player ${playerId}:`, error);
        return null;
      }
    }

    return player || null;
  }

  async saveMatchesToDatabase(matches: CricketMatch[], matchType: 'live' | 'upcoming' | 'completed'): Promise<void> {
    for (const match of matches) {
      try {
        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .eq('unique_id', match.id)
          .single();

        const matchData = {
          team1: match.teamInfo?.[0]?.name || match.teams?.[0] || 'Team 1',
          team2: match.teamInfo?.[1]?.name || match.teams?.[1] || 'Team 2',
          status: match.status,
          date: new Date(match.dateTimeGMT || match.date),
          type: match.matchType,
          unique_id: match.id
        };

        let matchId: string;

        if (existingMatch) {
          // Update existing match
          const { data: updatedMatch } = await supabase
            .from('matches')
            .update(matchData)
            .eq('unique_id', match.id)
            .select('id')
            .single();
          
          matchId = updatedMatch?.id;
        } else {
          // Insert new match
          const { data: newMatch } = await supabase
            .from('matches')
            .insert(matchData)
            .select('id')
            .single();
          
          matchId = newMatch?.id;
        }

        // Update scores if available
        if (match.score && matchId) {
          await this.saveScoresToDatabase(matchId, match);
        }

      } catch (error) {
        console.error(`Failed to save match ${match.id}:`, error);
      }
    }
  }

  private async saveScoresToDatabase(matchId: string, match: CricketMatch): Promise<void> {
    try {
      const team1Score = match.score?.[0] ? `${match.score[0].r}/${match.score[0].w} (${match.score[0].o})` : null;
      const team2Score = match.score?.[1] ? `${match.score[1].r}/${match.score[1].w} (${match.score[1].o})` : null;

      // Check if score exists
      const { data: existingScore } = await supabase
        .from('scores')
        .select('id')
        .eq('match_id', matchId)
        .single();

      const scoreData = {
        match_id: matchId,
        team1_score: team1Score,
        team2_score: team2Score,
        result: match.status === 'Match Finished' ? this.determineResult(match) : null
      };

      if (existingScore) {
        await supabase
          .from('scores')
          .update(scoreData)
          .eq('match_id', matchId);
      } else {
        await supabase
          .from('scores')
          .insert(scoreData);
      }
    } catch (error) {
      console.error(`Failed to save scores for match ${matchId}:`, error);
    }
  }

  private determineResult(match: CricketMatch): string | null {
    if (!match.score || match.score.length < 2) return null;
    
    const team1Score = match.score[0]?.r || 0;
    const team2Score = match.score[1]?.r || 0;
    
    if (team1Score > team2Score) {
      return `${match.teamInfo?.[0]?.name || 'Team 1'} won`;
    } else if (team2Score > team1Score) {
      return `${match.teamInfo?.[1]?.name || 'Team 2'} won`;
    }
    
    return 'Draw';
  }

  async savePlayerToDatabase(playerData: CricketPlayer): Promise<void> {
    try {
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('pid', playerData.id)
        .single();

      const player = {
        pid: playerData.id,
        name: playerData.name,
        country: playerData.country,
        stats: playerData.stats || {}
      };

      if (existingPlayer) {
        await supabase
          .from('players')
          .update(player)
          .eq('pid', playerData.id);
      } else {
        await supabase
          .from('players')
          .insert(player);
      }
    } catch (error) {
      console.error(`Failed to save player ${playerData.id}:`, error);
    }
  }

  async getMatchesFromDatabase(type?: string): Promise<any[]> {
    try {
      let query = supabase.from('matches').select(`
        id,
        team1,
        team2,
        status,
        date,
        type,
        unique_id,
        scores (
          team1_score,
          team2_score,
          result,
          updated_at
        )
      `);

      if (type) {
        // Filter by status for different types
        if (type === 'live') {
          query = query.in('status', ['Live', 'In Progress', 'Started']);
        } else if (type === 'upcoming') {
          query = query.in('status', ['Scheduled', 'Not Started', 'Upcoming']);
        } else if (type === 'completed') {
          query = query.in('status', ['Match Finished', 'Completed', 'Result']);
        }
      }

      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch matches from database:', error);
      return [];
    }
  }

  async getPlayerFromDatabase(playerId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('pid', playerId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error(`Failed to fetch player ${playerId} from database:`, error);
      return null;
    }
  }

  async refreshAllData(): Promise<void> {
    console.log('Starting data refresh...');
    
    try {
      // Fetch and save live matches
      const liveMatches = await this.fetchLiveMatches();
      await this.saveMatchesToDatabase(liveMatches, 'live');
      console.log(`Refreshed ${liveMatches.length} live matches`);

      // Fetch and save upcoming matches
      const upcomingMatches = await this.fetchUpcomingMatches();
      await this.saveMatchesToDatabase(upcomingMatches, 'upcoming');
      console.log(`Refreshed ${upcomingMatches.length} upcoming matches`);

    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  }
}

export const cricketService = new CricketService();