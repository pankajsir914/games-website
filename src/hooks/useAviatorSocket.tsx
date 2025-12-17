import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  message_type: 'user' | 'system' | 'win';
  multiplier?: number;
  amount?: number;
  created_at: string;
}

interface BetHistoryItem {
  id: string;
  user_id: string;
  username: string;
  bet_amount: number;
  auto_cashout_multiplier?: number;
  cashout_multiplier?: number;
  payout_amount: number;
  status: 'active' | 'cashed_out' | 'crashed';
  created_at: string;
}

interface AviatorRound {
  id: string;
  round_number: number;
  crash_multiplier: number;
  status: 'betting' | 'flying' | 'crashed';
  bet_start_time: string;
  bet_end_time: string;
  crash_time?: string;
  created_at: string;
  updated_at: string;
}

export const useAviatorSocket = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [liveBets, setLiveBets] = useState<BetHistoryItem[]>([]);
  const [currentRound, setCurrentRound] = useState<AviatorRound | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<Set<string>>(new Set());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connectSocket = useCallback(() => {
    if (!user) return;

    try {
      const wsUrl = `wss://foiojihgpeehvpwejeqw.functions.supabase.co/aviator-websocket-server`;
      const newSocket = new WebSocket(wsUrl);

      newSocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Join the game
        newSocket.send(JSON.stringify({
          type: 'join_game',
          data: {
            userId: user.id,
            username: user.email?.split('@')[0] || 'Anonymous'
          }
        }));
      };

      newSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);

          switch (message.type) {
            case 'connected':
              console.log('Successfully connected with client ID:', message.data.clientId);
              break;

            case 'current_round':
              setCurrentRound(message.data);
              break;

            case 'round_update':
              setCurrentRound(message.data);
              break;

            case 'live_bets':
              setLiveBets(message.data);
              break;

            case 'bet_update':
              // Update live bets when new bets are placed
              setLiveBets(prev => {
                const updated = prev.filter(bet => bet.id !== message.data.id);
                return [message.data, ...updated].slice(0, 50);
              });
              break;

            case 'chat_history':
              setMessages(message.data);
              break;

            case 'new_message':
              setMessages(prev => [...prev, message.data]);
              break;

            case 'user_joined':
              setConnectedUsers(prev => new Set([...prev, message.data.userId]));
              setMessages(prev => [...prev, {
                id: `system-${Date.now()}`,
                user_id: 'system',
                username: 'System',
                message: `${message.data.username} joined the game`,
                message_type: 'system',
                created_at: new Date().toISOString()
              }]);
              break;

            case 'user_left':
              setConnectedUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(message.data.userId);
                return newSet;
              });
              setMessages(prev => [...prev, {
                id: `system-${Date.now()}`,
                user_id: 'system',
                username: 'System',
                message: `${message.data.username} left the game`,
                message_type: 'system',
                created_at: new Date().toISOString()
              }]);
              break;

            case 'player_bet':
              setMessages(prev => [...prev, {
                id: `system-${Date.now()}`,
                user_id: 'system',
                username: 'System',
                message: `${message.data.username} placed a bet of ₹${message.data.betAmount}`,
                message_type: 'system',
                created_at: new Date().toISOString()
              }]);
              break;

            case 'player_cashout':
              setMessages(prev => [...prev, {
                id: `system-${Date.now()}`,
                user_id: 'system',
                username: 'System',
                message: `${message.data.username} cashed out at ${message.data.multiplier}x for ₹${message.data.payoutAmount}`,
                message_type: 'win',
                multiplier: message.data.multiplier,
                amount: message.data.payoutAmount,
                created_at: new Date().toISOString()
              }]);
              break;

            case 'bet_success':
              toast({
                title: "Bet Placed",
                description: `₹${message.data.bet_amount} bet placed successfully!`,
              });
              break;

            case 'bet_error':
              toast({
                title: "Bet Failed",
                description: message.data.message,
                variant: "destructive",
              });
              break;

            case 'cashout_success':
              toast({
                title: "Cash Out Successful!",
                description: `You won ₹${message.data.payout_amount.toFixed(2)} at ${message.data.cashout_multiplier.toFixed(2)}x`,
              });
              break;

            case 'cashout_error':
              toast({
                title: "Cash Out Failed",
                description: message.data.message,
                variant: "destructive",
              });
              break;

            case 'error':
              console.error('WebSocket error:', message.data.message);
              toast({
                title: "Error",
                description: message.data.message,
                variant: "destructive",
              });
              break;

            default:
              console.log('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      newSocket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000;
          reconnectAttempts.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connectSocket();
          }, delay);
        } else {
          toast({
            title: "Connection Lost",
            description: "Unable to reconnect to the game server. Please refresh the page.",
            variant: "destructive",
          });
        }
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      setSocket(newSocket);
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [user]);

  const sendMessage = useCallback((message: string) => {
    if (socket && socket.readyState === WebSocket.OPEN && message.trim()) {
      socket.send(JSON.stringify({
        type: 'send_message',
        data: { message: message.trim() }
      }));
    }
  }, [socket]);

  const placeBet = useCallback((roundId: string, betAmount: number, autoCashoutMultiplier?: number) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'place_bet',
        data: {
          roundId,
          betAmount,
          autoCashoutMultiplier
        }
      }));
    }
  }, [socket]);

  const cashOut = useCallback((betId: string, currentMultiplier: number) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'cash_out',
        data: {
          betId,
          currentMultiplier
        }
      }));
    }
  }, [socket]);

  useEffect(() => {
    if (user) {
      connectSocket();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [user, connectSocket]);

  return {
    isConnected,
    messages,
    liveBets,
    currentRound,
    connectedUsers: connectedUsers.size,
    sendMessage,
    placeBet,
    cashOut
  };
};