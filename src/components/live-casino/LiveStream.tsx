import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";

interface LiveStreamProps {
  tableId: string;
  streamUrl?: string;
  tableName?: string;
}

export const LiveStream = ({ tableId, streamUrl, tableName }: LiveStreamProps) => {
  if (!streamUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Live Stream - {tableName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
            <p className="text-white/60">Stream not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          LIVE - {tableName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={streamUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen; encrypted-media"
            allowFullScreen
            title={`Live stream for ${tableName}`}
          />
        </div>
      </CardContent>
    </Card>
  );
};
