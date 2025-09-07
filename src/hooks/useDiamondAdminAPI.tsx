import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DiamondSIDConfig {
  id?: string;
  sport_type: string;
  sid: string | null;
  is_active: boolean;
  auto_sync: boolean;
  sync_interval: number;
  last_sync_at?: string;
}

export interface DiamondMatchResult {
  match_id: string;
  event_id?: string;
  market_id: string;
  selection_id: string;
  sport_type: string;
  result_status: 'pending' | 'win' | 'loss' | 'void' | 'refund';
  result_data?: any;
}

export interface DiamondAPILog {
  id: string;
  endpoint: string;
  method: string;
  params?: any;
  response?: any;
  status_code?: number;
  response_time_ms?: number;
  created_at: string;
}

export function useDiamondAdminAPI() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Get all configured SIDs
  const getSIDConfigs = useCallback(async (sportType?: string) => {
    try {
      let query = supabase
        .from('diamond_sports_config')
        .select('*')
        .order('sport_type', { ascending: true });

      if (sportType) {
        query = query.eq('sport_type', sportType);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data as DiamondSIDConfig[];
    } catch (error: any) {
      console.error('Failed to fetch SID configs:', error);
      return [];
    }
  }, []);

  // Manage SID configuration
  const manageSID = useCallback(async (config: DiamondSIDConfig) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('manage_diamond_sports_sid', {
        p_sport_type: config.sport_type,
        p_sid: config.sid,
        p_is_active: config.is_active,
        p_auto_sync: config.auto_sync,
        p_sync_interval: config.sync_interval
      });

      if (error) throw error;

      toast({
        title: "SID Configuration Updated",
        description: `${config.sport_type} SID ${config.sid || 'default'} configured successfully`
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update SID configuration",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Delete SID configuration
  const deleteSID = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('diamond_sports_config')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "SID Deleted",
        description: "SID configuration removed successfully"
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete SID",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Post match result
  const postMatchResult = useCallback(async (result: DiamondMatchResult) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('post_diamond_match_result', {
        p_match_id: result.match_id,
        p_market_id: result.market_id,
        p_selection_id: result.selection_id,
        p_result: result.result_status,
        p_sport_type: result.sport_type,
        p_event_id: result.event_id,
        p_result_data: result.result_data
      });

      if (error) throw error;

      toast({
        title: "Result Posted",
        description: `Match result for ${result.match_id} posted successfully`
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post match result",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Get match results
  const getMatchResults = useCallback(async (matchId?: string) => {
    try {
      let query = supabase
        .from('diamond_match_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (matchId) {
        query = query.eq('match_id', matchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data;
    } catch (error: any) {
      console.error('Failed to fetch match results:', error);
      return [];
    }
  }, []);

  // Test API endpoint
  const testEndpoint = useCallback(async (
    endpoint: string,
    method: string = 'GET',
    params?: any
  ) => {
    const startTime = Date.now();
    setLoading(true);
    
    try {
      const { data: response, error } = await supabase.functions.invoke('sports-diamond-proxy', {
        body: {
          path: endpoint,
          method,
          params
        }
      });

      const responseTime = Date.now() - startTime;
      const statusCode = error ? 500 : 200;

      // Log the test
      await supabase.rpc('log_diamond_api_test', {
        p_endpoint: endpoint,
        p_method: method,
        p_params: params,
        p_response: response,
        p_status_code: statusCode,
        p_response_time_ms: responseTime
      });

      if (error) throw error;

      toast({
        title: "Endpoint Test Successful",
        description: `${method} ${endpoint} responded in ${responseTime}ms`
      });

      return response;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Log failed test
      await supabase.rpc('log_diamond_api_test', {
        p_endpoint: endpoint,
        p_method: method,
        p_params: params,
        p_response: { error: error.message },
        p_status_code: 500,
        p_response_time_ms: responseTime
      });

      toast({
        title: "Endpoint Test Failed",
        description: error.message || "Failed to test endpoint",
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Get API test logs
  const getAPILogs = useCallback(async (limit: number = 50) => {
    try {
      const { data, error } = await supabase
        .from('diamond_api_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data as DiamondAPILog[];
    } catch (error: any) {
      console.error('Failed to fetch API logs:', error);
      return [];
    }
  }, []);

  return {
    loading,
    // SID Management
    getSIDConfigs,
    manageSID,
    deleteSID,
    // Match Results
    postMatchResult,
    getMatchResults,
    // API Testing
    testEndpoint,
    getAPILogs
  };
}