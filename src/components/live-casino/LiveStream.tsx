import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, ExternalLink, AlertCircle } from "lucide-react";
import { useState } from "react";

interface LiveStreamProps {
  tableId: string;
  streamUrl?: string;
  tableName?: string;
}

export const LiveStream = ({ tableId, streamUrl, tableName }: LiveStreamProps) => {
  const [iframeError, setIframeError] = useState(false);

  const handleWatchExternal = () => {
    if (streamUrl) {
      window.open(streamUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (!streamUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <PlayCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            Live Stream - {tableName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <p className="text-white/60 text-xs sm:text-sm">Stream not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-base sm:text-lg">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            LIVE - {tableName}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleWatchExternal}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open Stream
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {iframeError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
              <div>
                <p className="text-white font-medium mb-2">Stream Restricted</p>
                <p className="text-white/60 text-sm mb-4">
                  Domain whitelisting required. Click below to watch the stream.
                </p>
              </div>
              <Button onClick={handleWatchExternal} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Watch Live Stream
              </Button>
            </div>
          ) : (
            <iframe
              src={streamUrl}
              className="w-full h-full"
              allow="autoplay; fullscreen; encrypted-media"
              allowFullScreen
              title={`Live stream for ${tableName}`}
              onError={() => setIframeError(true)}
              onLoad={(e) => {
                // Check if iframe loaded empty or blocked
                try {
                  const iframe = e.target as HTMLIFrameElement;
                  // If we can't access contentWindow, it might be blocked
                  if (!iframe.contentWindow?.document) {
                    setIframeError(true);
                  }
                } catch {
                  // Cross-origin error - means iframe loaded but we can't check
                  // This is expected for external domains, so don't set error
                }
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
