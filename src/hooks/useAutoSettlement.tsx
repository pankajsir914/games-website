import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AutoSettlementResult {
  success: boolean;
  settled_count?: number;
  failed_count?: number;
  settled_markets?: Array<{
    market_id: string;
    market_name: string;
    settlement_result: any;
  }>;
  failed_markets?: Array<{
    market_id: string;
    market_name: string;
    error: string;
  }>;
  error?: string;
}

export function useAutoSettlement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Auto-settle a specific market using API result
   */
  const settleMarket = useCallback(async (
    marketId: string,
    sportsid: string,
    gmid: string
  ): Promise<AutoSettlementResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('auto-settle-markets', {
        body: {
          market_id: marketId,
          sportsid,
          gmid
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) {
        throw new Error(data?.error || 'Auto-settlement failed');
      }

      toast({
        title: "Market Settled",
        description: `Market has been automatically settled from API result.`,
      });

      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to settle market';
      setError(errorMsg);
      toast({
        title: "Settlement Failed",
        description: errorMsg,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Auto-settle all open markets for an event
   */
  const settleAllMarkets = useCallback(async (
    sportsid: string,
    gmid: string
  ): Promise<AutoSettlementResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('auto-settle-markets', {
        body: {
          sportsid,
          gmid,
          auto_settle_all: true
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) {
        throw new Error(data?.error || 'Auto-settlement failed');
      }

      const settledCount = data.settled_count || 0;
      const failedCount = data.failed_count || 0;

      toast({
        title: "Markets Settled",
        description: `${settledCount} market(s) settled successfully. ${failedCount > 0 ? `${failedCount} failed.` : ''}`,
        variant: failedCount > 0 ? "destructive" : "default"
      });

      return data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to settle markets';
      setError(errorMsg);
      toast({
        title: "Settlement Failed",
        description: errorMsg,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch result from API without settling
   */
  const fetchResult = useCallback(async (
    sportsid: string,
    gmid: string
  ): Promise<any> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('auto-settle-markets', {
        body: {
          sportsid,
          gmid
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to fetch result');
      }

      return data.result_data;
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch result';
      setError(errorMsg);
      toast({
        title: "Fetch Failed",
        description: errorMsg,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    settleMarket,
    settleAllMarkets,
    fetchResult
  };
}

