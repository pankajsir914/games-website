import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DiamondSIDConfig {
  id?: string;
  sport_type: string;
  sid: string | null;
  label?: string | null;
  is_active: boolean;
  is_default?: boolean;
  auto_sync: boolean;
  sync_interval: number;
  last_sync_at?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
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
      const { data, error } = await (supabase as any).rpc('get_diamond_sids', {
        p_sport_type: sportType ?? null,
      });
      if (error) throw error;
      const rows = ((data as any)?.sids as any[]) || [];
      return rows as DiamondSIDConfig[];
    } catch (error: any) {
      console.error('Failed to fetch SID configs:', error);
      return [];
    }
  }, []);

  // Manage SID configuration
  const manageSID = useCallback(async (config: DiamondSIDConfig) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any).rpc('manage_diamond_sports_sid', {
        p_id: config.id ?? null,
        p_sport_type: config.sport_type,
        p_sid: config.sid,
        p_label: config.label ?? null,
        p_is_active: config.is_active,
        p_is_default: config.is_default ?? false,
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
      const { error } = await (supabase as any).rpc('delete_diamond_sports_sid', { p_id: id });

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

      if (error) throw error;

      toast({
        title: "Endpoint Test Successful",
        description: `${method} ${endpoint} responded in ${responseTime}ms`
      });

      // Return response with metadata for storing
      return {
        response,
        metadata: {
          endpoint,
          method,
          params,
          response_time_ms: responseTime,
          status_code: statusCode
        }
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      toast({
        title: "Endpoint Test Failed",
        description: error.message || "Failed to test endpoint",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Store API response to database
  const storeAPIResponse = useCallback(async (
    endpoint: string,
    method: string,
    params: any,
    response: any,
    responseTime: number,
    notes?: string,
    tags?: string[]
  ) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('diamond_api_logs')
        .insert({
          endpoint,
          method,
          params,
          response,
          status_code: response?.success ? 200 : 400,
          response_time_ms: responseTime,
          tested_by: user?.user?.id,
          notes,
          tags
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Response Stored",
        description: "API response saved to database successfully"
      });
      
      return data;
    } catch (error: any) {
      toast({
        title: "Storage Failed",
        description: error.message || "Failed to store API response",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  // Get stored API responses with filters
  const getStoredResponses = useCallback(async (filters?: {
    endpoint?: string;
    method?: string;
    limit?: number;
    search?: string;
  }) => {
    try {
      let query = supabase
        .from('diamond_api_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.endpoint) {
        query = query.eq('endpoint', filters.endpoint);
      }
      if (filters?.method) {
        query = query.eq('method', filters.method);
      }
      if (filters?.search) {
        query = query.ilike('endpoint', `%${filters.search}%`);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(50);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Failed to get stored responses:', error);
      return [];
    }
  }, []);

  // Delete stored API response
  const deleteStoredResponse = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('diamond_api_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Response Deleted",
        description: "Stored API response removed successfully"
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete stored response",
        variant: "destructive"
      });
      return false;
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
    getAPILogs,
    storeAPIResponse,
    getStoredResponses,
    deleteStoredResponse
  };
}