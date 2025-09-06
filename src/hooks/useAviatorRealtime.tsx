import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  message_type: 'user' | 'win' | 'system';
  multiplier?: number;
  amount?: number;
  created_at: string;
}

export interface LiveBet {
  id: string;
  user_id: string;
  username: string;
  bet_amount: number;
  auto_cashout_multiplier?: number;
  cashout_multiplier?: number;
  payout_amount?: number;
  status: 'active' | 'cashed_out' | 'crashed';
  round_number: number;
  created_at: string;
}

export const useAviatorRealtime = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load initial data
  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      // Load recent chat messages
      const { data: chatData } = await supabase
        .from('aviator_chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (chatData) {
        setMessages(chatData.reverse() as ChatMessage[]);
      }

      // Load live bets
      const { data: betsData } = await supabase
        .from('aviator_live_bets')
        .select('*')
        .limit(30);

      if (betsData) {
        setLiveBets(betsData as LiveBet[]);
      }

      // Estimate connected users
      const { count } = await supabase
        .from('aviator_bets')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

      setConnectedUsers(count || 0);
    };

    loadInitialData();
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to chat messages
    const chatChannel = supabase
      .channel('aviator-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'aviator_chat_messages',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev.slice(-49), newMessage]);
        }
      )
      .subscribe();

    // Subscribe to bet updates
    const betsChannel = supabase
      .channel('aviator-bets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'aviator_bets',
        },
        async () => {
          // Refresh live bets view
          const { data } = await supabase
            .from('aviator_live_bets')
            .select('*')
            .limit(30);

          if (data) {
            setLiveBets(data as LiveBet[]);
          }
        }
      )
      .subscribe();

    // Simulate user presence updates
    const presenceInterval = setInterval(() => {
      setConnectedUsers((prev) => Math.max(1, prev + Math.floor(Math.random() * 3 - 1)));
    }, 5000);

    return () => {
      chatChannel.unsubscribe();
      betsChannel.unsubscribe();
      clearInterval(presenceInterval);
    };
  }, [user]);

  const sendMessage = async (message: string) => {
    if (!user || !message.trim()) return;

    try {
      const { error } = await supabase.rpc('create_aviator_chat_message', {
        p_message: message,
        p_message_type: 'user',
      });

      if (error) {
        toast({
          title: 'Failed to send message',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  return {
    messages,
    liveBets,
    connectedUsers,
    sendMessage,
  };
};