import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameMessage {
  type: string;
  data?: any;
  userId?: string;
  username?: string;
}

interface ConnectedClient {
  socket: WebSocket;
  userId?: string;
  username?: string;
}

// Store active connections
const clients = new Map<string, ConnectedClient>();

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const clientId = crypto.randomUUID();
  
  socket.onopen = () => {
    console.log(`Client ${clientId} connected`);
    clients.set(clientId, { socket });
    
    // Send welcome message
    socket.send(JSON.stringify({
      type: 'connected',
      data: { clientId }
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message: GameMessage = JSON.parse(event.data);
      console.log(`Received message from ${clientId}:`, message);

      const client = clients.get(clientId);
      if (!client) return;

      switch (message.type) {
        case 'join_game':
          client.userId = message.data.userId;
          client.username = message.data.username;
          clients.set(clientId, client);
          
          // Broadcast user joined
          broadcastToAll({
            type: 'user_joined',
            data: { 
              userId: message.data.userId,
              username: message.data.username 
            }
          }, clientId);

          // Send current game state
          await sendCurrentGameState(socket);
          await sendRecentChatMessages(socket);
          break;

        case 'send_message':
          await handleChatMessage(message.data, client);
          break;

        case 'place_bet':
          await handlePlaceBet(message.data, client);
          break;

        case 'cash_out':
          await handleCashOut(message.data, client);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid message format' }
      }));
    }
  };

  socket.onclose = () => {
    console.log(`Client ${clientId} disconnected`);
    const client = clients.get(clientId);
    if (client?.userId) {
      broadcastToAll({
        type: 'user_left',
        data: { 
          userId: client.userId,
          username: client.username 
        }
      }, clientId);
    }
    clients.delete(clientId);
  };

  socket.onerror = (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  };

  // Broadcast game events from database changes
  const gameChannel = supabase
    .channel('aviator-game-events')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'aviator_rounds'
    }, (payload) => {
      broadcastToAll({
        type: 'round_update',
        data: payload.new || payload.old
      });
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'aviator_bets'
    }, (payload) => {
      broadcastToAll({
        type: 'bet_update',
        data: payload.new || payload.old
      });
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'aviator_chat_messages'
    }, (payload) => {
      broadcastToAll({
        type: 'new_message',
        data: payload.new
      });
    })
    .subscribe();

  async function handleChatMessage(data: any, client: ConnectedClient) {
    if (!client.userId || !data.message?.trim()) return;

    try {
      const { data: messageData, error } = await supabase.rpc('create_aviator_chat_message', {
        p_user_id: client.userId,
        p_username: client.username || 'Anonymous',
        p_message: data.message.trim()
      });

      if (error) {
        console.error('Error creating chat message:', error);
        client.socket.send(JSON.stringify({
          type: 'error',
          data: { message: 'Failed to send message' }
        }));
      }
    } catch (error) {
      console.error('Error in handleChatMessage:', error);
    }
  }

  async function handlePlaceBet(data: any, client: ConnectedClient) {
    if (!client.userId) return;

    try {
      const { data: betData, error } = await supabase.rpc('place_aviator_bet', {
        p_round_id: data.roundId,
        p_bet_amount: data.betAmount,
        p_auto_cashout_multiplier: data.autoCashoutMultiplier
      });

      if (error) {
        client.socket.send(JSON.stringify({
          type: 'bet_error',
          data: { message: error.message }
        }));
      } else {
        // Broadcast bet placement to all clients
        broadcastToAll({
          type: 'player_bet',
          data: {
            userId: client.userId,
            username: client.username,
            betAmount: data.betAmount,
            autoCashoutMultiplier: data.autoCashoutMultiplier
          }
        });

        client.socket.send(JSON.stringify({
          type: 'bet_success',
          data: betData
        }));
      }
    } catch (error) {
      console.error('Error in handlePlaceBet:', error);
    }
  }

  async function handleCashOut(data: any, client: ConnectedClient) {
    if (!client.userId) return;

    try {
      const { data: cashoutData, error } = await supabase.rpc('cashout_aviator_bet', {
        p_bet_id: data.betId,
        p_current_multiplier: data.currentMultiplier
      });

      if (error) {
        client.socket.send(JSON.stringify({
          type: 'cashout_error',
          data: { message: error.message }
        }));
      } else {
        // Broadcast cashout to all clients
        broadcastToAll({
          type: 'player_cashout',
          data: {
            userId: client.userId,
            username: client.username,
            multiplier: data.currentMultiplier,
            payoutAmount: cashoutData.payout_amount
          }
        });

        client.socket.send(JSON.stringify({
          type: 'cashout_success',
          data: cashoutData
        }));

        // Create win message in chat
        await supabase.rpc('create_aviator_chat_message', {
          p_user_id: client.userId,
          p_username: client.username || 'Anonymous',
          p_message: `won ₹${cashoutData.payout_amount}`,
          p_message_type: 'win',
          p_multiplier: data.currentMultiplier,
          p_amount: cashoutData.payout_amount
        });
      }
    } catch (error) {
      console.error('Error in handleCashOut:', error);
    }
  }

  async function sendCurrentGameState(socket: WebSocket) {
    try {
      const { data: currentRound } = await supabase
        .from('aviator_rounds')
        .select('*')
        .in('status', ['betting', 'flying'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (currentRound) {
        socket.send(JSON.stringify({
          type: 'current_round',
          data: currentRound
        }));
      }

      // Send live betting data
      const { data: liveBets } = await supabase
        .from('aviator_live_bets')
        .select('*')
        .limit(50);

      if (liveBets) {
        socket.send(JSON.stringify({
          type: 'live_bets',
          data: liveBets
        }));
      }
    } catch (error) {
      console.error('Error sending current game state:', error);
    }
  }

  async function sendRecentChatMessages(socket: WebSocket) {
    try {
      const { data: messages } = await supabase
        .from('aviator_chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (messages) {
        socket.send(JSON.stringify({
          type: 'chat_history',
          data: messages.reverse()
        }));
      }
    } catch (error) {
      console.error('Error sending chat messages:', error);
    }
  }

  function broadcastToAll(message: any, excludeClientId?: string) {
    const messageStr = JSON.stringify(message);
    for (const [clientId, client] of clients.entries()) {
      if (clientId !== excludeClientId && client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.send(messageStr);
        } catch (error) {
          console.error(`Error sending to client ${clientId}:`, error);
          clients.delete(clientId);
        }
      }
    }
  }

  return response;
});