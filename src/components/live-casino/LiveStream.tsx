// src/components/live-casino/LiveStream.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import Hls from "hls.js";
import { io, Socket } from "socket.io-client";

interface LiveStreamProps {
  tableId: string;   
  tableName?: string;
}  

export const LiveStream = ({ tableId, tableName }: LiveStreamProps) => {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [tokenRefreshAttempts, setTokenRefreshAttempts] = useState(0);
  const [originalStreamData, setOriginalStreamData] = useState<{streamUrl?: string, proxiedUrl?: string, hostingerProxyUrl?: string} | null>(null);
  const MAX_TOKEN_REFRESH_ATTEMPTS = 3;

  /** NEW */
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [bettingOpen, setBettingOpen] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // ================= STREAM URL =================
  const fetchStreamUrl = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "diamond-casino-proxy",
        { body: { action: "get-stream-url", tableId } }
      );

      if (error) {
        console.error("Stream URL fetch error:", error);
        throw error;
      }

      // Log full response for debugging
      console.log("📥 Full response from edge function:", JSON.stringify(data, null, 2));
      
      // Extract stream URL - Edge Function now returns direct URL only
      const streamUrl = data?.streamUrl || data?.data?.streamUrl || data?.url || data?.data?.url || data?.data?.data?.tv_url || null;
      
      console.log("🔍 Stream URL from Edge Function:", streamUrl);
      
      if (!streamUrl || !streamUrl.startsWith('http')) {
        console.warn("❌ No valid stream URL available for table:", tableId);
        console.warn("Response data:", data);
        setError(true);
        setStreamUrl(null);
        return;
      }

      console.log("✅ Using direct stream URL:", streamUrl);
      
      setStreamUrl(streamUrl);
      setError(false);
    } catch (err) {
      console.error("Stream URL error:", err);
      setError(true);
      setStreamUrl(null);
    }
  };

  useEffect(() => {
    if (!tableId) return;

    fetchStreamUrl();
    const interval = setInterval(fetchStreamUrl, 60 * 1000);
    return () => clearInterval(interval);
  }, [tableId]);

  // ================= HLS =================
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.play().catch(() => {});
      return;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true,
        liveDurationInfinity: true,
        xhrSetup: (xhr, url) => {
          // Add CORS headers for all requests
          xhr.withCredentials = false;
          
          // Simple CORS setup - no special headers needed
        },
        enableWorker: true,
        debug: false,
      });

      console.log('📺 Loading HLS stream from:', streamUrl);
      
      hls.loadSource(streamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ HLS manifest parsed successfully');
        setError(false);
        video.play().catch((err) => {
          console.error('Video play error:', err);
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS error:', {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          url: data.url,
          response: data.response,
          error: data.error
        });
        
        // Check for 403/401 errors (authentication/authorization)
        if (data?.response?.code === 403 || data?.response?.code === 401) {
          console.error('❌ HLS Stream access denied (403/401):', data);
          
          // If using direct URL and getting 403, try switching to proxied URL
          if (streamUrl && streamUrl.startsWith('http') && !streamUrl.includes('diamond-casino-proxy')) {
            console.log('🔄 Direct stream URL failed with 403/401, switching to proxied URL...');
            
            // Use stored proxied URL or construct it
            const proxiedUrl = originalStreamData?.proxiedUrl || 
              `https://foiojihgpeehvpwejeqw.supabase.co/functions/v1/diamond-casino-proxy?stream=${encodeURIComponent(streamUrl)}`;
            
            console.log('🔄 Retrying with proxied URL:', proxiedUrl);
            // Update stream URL to use proxy
            setTimeout(() => {
              setStreamUrl(proxiedUrl);
            }, 1000);
            return; // Don't set error, let it retry with proxy
          }
          
          console.error('❌ Stream server is blocking access. This may require authentication or domain whitelisting.');
          setError(true);
          return;
        }
        
        if (data?.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('❌ HLS Network Error:', data);
              // Check if it's a 403 error
              if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR) {
                if (data.response?.code === 403 || data.response?.code === 401) {
                  console.error('❌ Stream access forbidden (403/401) - Stream server is blocking access');
                  console.error('💡 Solution: The stream server requires domain whitelisting or authentication');
                } else if (data.response?.code === 0) {
                  console.error('❌ CORS error or network failure');
                } else if (data.response?.code === 500) {
                  console.error('❌ Edge function proxy error (500) - Check Supabase logs');
                  // Try to fetch the error response to see what the edge function is returning
                  if (data.url) {
                    fetch(data.url)
                      .then(async (res) => {
                        const errorText = await res.text();
                        console.error('❌ Edge function error response:', errorText);
                        try {
                          const errorJson = JSON.parse(errorText);
                          console.error('❌ Edge function error JSON:', errorJson);
                          
                          // Check if it's a token expiration error (either from htmlPreview or tokenExpired flag)
                          const isTokenExpired = errorJson.tokenExpired || 
                                                (errorJson.htmlPreview && errorJson.htmlPreview.includes('Invalid Stream Token'));
                          
                          if (isTokenExpired) {
                            console.log('🔄 Stream token expired or invalid. Refreshing stream URL...');
                            
                            // Refresh the stream URL to get a new token
                            if (tokenRefreshAttempts < MAX_TOKEN_REFRESH_ATTEMPTS) {
                              const newAttempts = tokenRefreshAttempts + 1;
                              setTokenRefreshAttempts(newAttempts);
                              console.log(`🔄 Token refresh attempt ${newAttempts}/${MAX_TOKEN_REFRESH_ATTEMPTS}`);
                              
                              // Wait a bit before refreshing
                              setTimeout(async () => {
                                try {
                                  await fetchStreamUrl();
                                } catch (refreshError) {
                                  console.error('❌ Error refreshing stream URL:', refreshError);
                                  if (newAttempts >= MAX_TOKEN_REFRESH_ATTEMPTS) {
                                    setError(true);
                                  }
                                }
                              }, 1000);
                            } else {
                              console.error('❌ Max token refresh attempts reached');
                              setError(true);
                            }
                          }
                        } catch (e) {
                          // Not JSON, that's fine
                        }
                      })
                      .catch((fetchErr) => {
                        console.error('❌ Could not fetch error details:', fetchErr);
                      });
                  }
                } else {
                  console.error(`❌ Network error: ${data.response?.code || 'unknown'}`);
                }
              }
              setError(true);
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('❌ HLS Media Error:', data);
              // Try to recover
              if (data.fatal) {
                switch (data.details) {
                  case Hls.ErrorDetails.MANIFEST_LOAD_ERROR:
                  case Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT:
                  case Hls.ErrorDetails.MANIFEST_PARSING_ERROR:
                    console.error('❌ Manifest error - cannot recover');
                    setError(true);
                    break;
                  default:
                    // Try to recover
                    try {
                      console.log('🔄 Attempting to recover from media error...');
                      hls.recoverMediaError();
                    } catch (e) {
                      console.error('❌ Failed to recover from media error:', e);
                      setError(true);
                    }
                }
              }
              break;
            default:
              console.error('❌ HLS Fatal Error:', data);
              setError(true);
              break;
          }
        } else {
          // Non-fatal errors - just log
          console.warn('⚠️ HLS non-fatal error:', data);
        }
      });
      
      hlsRef.current = hls;
    } else {
      console.error('❌ HLS.js is not supported in this browser');
      setError(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // ================= SOCKET TIMER (NEW) =================
  useEffect(() => {
    const isSecure = window.location.protocol === 'https:';
    
    // On HTTPS, we cannot connect to insecure WebSocket (ws://)
    // The server at 72.61.169.60:8000 doesn't support WSS/HTTPS
    // So we'll skip socket connection on HTTPS to avoid Mixed Content errors
    if (isSecure) {
      console.warn("Socket connection skipped on HTTPS - server doesn't support secure WebSocket");
      // Set default values when socket is unavailable
      setBettingOpen(false);
      setSecondsLeft(0);
      return;
    }
    
    // Only connect on HTTP (local development)
    const socketUrl = "http://72.61.169.60:8000/casino";
    
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected to:", socketUrl);
      socket.emit("join-table", tableId);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      // Gracefully handle - timer is optional
      setBettingOpen(false);
      setSecondsLeft(0);
    });

    socket.on("round-timer", (payload: any) => {
      if (payload.tableId !== tableId) return;

      setSecondsLeft(Number(payload.lt || 0));
      setBettingOpen(payload.status === "OPEN");
    });

    return () => {
      if (socket.connected) {
        socket.emit("leave-table", tableId);
      }
      socket.disconnect();
    };
  }, [tableId]);

  // ================= LOCAL COUNTDOWN =================
  useEffect(() => {
    if (!bettingOpen || secondsLeft <= 0) return;

    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(t);
  }, [secondsLeft, bettingOpen]);

  const openExternal = () => {
    if (streamUrl) window.open(streamUrl, "_blank");
  };

  // ================= UI =================
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          LIVE – {tableName}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {error || !streamUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-4">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
              <div className="space-y-2 max-w-md">
                <p className="text-white font-semibold">Stream Access Restricted</p>
                <p className="text-white/70 text-sm">
                  The live stream server is blocking access (403 Forbidden). This is typically due to:
                </p>
                <ul className="text-white/60 text-xs text-left list-disc list-inside space-y-1 mt-2">
                  <li>CORS (Cross-Origin) restrictions on the stream server</li>
                  <li>Authentication/authorization requirements</li>
                  <li>IP or domain-based access controls</li>
                </ul>
                <p className="text-white/50 text-xs mt-3">
                  <strong>Solution:</strong> Contact the stream provider to whitelist your domain or configure CORS settings.
                </p>
              </div>
              {streamUrl && (
                <div className="flex flex-col gap-2 mt-2">
                  <Button onClick={openExternal} className="gap-2" variant="outline">
                    <ExternalLink className="h-4 w-4" />
                    Try Opening Stream in New Tab
                  </Button>
                  <p className="text-white/50 text-xs">
                    Opening in a new tab may bypass CORS restrictions
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full"
                muted
                autoPlay
                playsInline
                controls={false}
                {...({ referrerPolicy: 'strict-origin-when-cross-origin' } as React.VideoHTMLAttributes<HTMLVideoElement>)}
              />

              {/* LEFT BOTTOM */}
              <div
                className={`absolute bottom-2 left-2 px-3 py-1.5 rounded-md text-xs sm:text-sm text-white ${
                  bettingOpen ? "bg-green-600/80" : "bg-red-600/80"
                }`}
              >
                {bettingOpen
                  ? "Place your bets now"
                  : "Betting closed. Waiting for next round…"}
              </div>

              {/* RIGHT BOTTOM */}
              <div
                className={`absolute bottom-2 right-2 px-3 py-1.5 rounded-md text-xs sm:text-sm text-white font-mono ${
                  bettingOpen ? "bg-green-600/80" : "bg-red-600/80"
                }`}
              >
                {bettingOpen
                  ? `Time left: ${secondsLeft}s`
                  : "Next round soon"}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
