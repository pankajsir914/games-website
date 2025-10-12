import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConnectedClient {
  socket: WebSocket;
  matchId: string;
  sid: string;
  lastOdds?: string; // JSON string for comparison
}

const clients = new Map<string, ConnectedClient>();

// Poll Diamond API and send updates to relevant clients
async function pollAndBroadcast() {
  const RAPIDAPI_KEY = Deno.env.get('RAPIDAPI_KEY');
  if (!RAPIDAPI_KEY) {
    console.error('RAPIDAPI_KEY not configured');
    return;
  }

  // Group clients by match+sid
  const subscriptions = new Map<string, ConnectedClient[]>();
  
  clients.forEach((client) => {
    const key = `${client.sid}:${client.matchId}`;
    if (!subscriptions.has(key)) {
      subscriptions.set(key, []);
    }
    subscriptions.get(key)!.push(client);
  });

  // Fetch odds for each unique match
  for (const [key, clientList] of subscriptions.entries()) {
    const [sid, matchId] = key.split(':');
    
    try {
      const url = `https://diamond-sports-api-d247-sky-exchange-betfair.p.rapidapi.com/sports/getPriveteData?sid=${sid}&gmid=${matchId}`;
      
      const response = await fetch(url, {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'diamond-sports-api-d247-sky-exchange-betfair.p.rapidapi.com'
        }
      });

      if (!response.ok) continue;

      const data = await response.json();
      const oddsJson = JSON.stringify(data);

      // Send to clients if odds changed
      clientList.forEach((client) => {
        if (client.socket.readyState === WebSocket.OPEN) {
          if (client.lastOdds !== oddsJson) {
            client.lastOdds = oddsJson;
            client.socket.send(JSON.stringify({
              type: 'odds_update',
              data: data
            }));
          }
        }
      });
    } catch (error) {
      console.error(`Error fetching odds for ${key}:`, error);
    }
  }
}

// Start polling loop
let pollingInterval: number | null = null;

function startPolling() {
  if (pollingInterval === null && clients.size > 0) {
    console.log('Starting odds polling');
    pollingInterval = setInterval(pollAndBroadcast, 2000) as unknown as number; // Poll every 2 seconds
  }
}

function stopPolling() {
  if (pollingInterval !== null && clients.size === 0) {
    console.log('Stopping odds polling');
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const upgrade = req.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket", { status: 426 });
  }

  const url = new URL(req.url);
  const matchId = url.searchParams.get("matchId");
  const sid = url.searchParams.get("sid");

  if (!matchId || !sid) {
    return new Response("matchId and sid required", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  const clientId = crypto.randomUUID();

  socket.onopen = () => {
    console.log(`Client ${clientId} connected for match ${matchId}`);
    clients.set(clientId, { socket, matchId, sid });
    startPolling();
    
    // Send initial message
    socket.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connected, odds updates will stream'
    }));
  };

  socket.onclose = () => {
    console.log(`Client ${clientId} disconnected`);
    clients.delete(clientId);
    stopPolling();
  };

  socket.onerror = (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
    clients.delete(clientId);
    stopPolling();
  };

  return response;
});
