import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tv, Radio, AlertCircle, ExternalLink, Play
} from 'lucide-react';

interface EnhancedLiveTVSectionProps {
  matchId: string;
  match: any;
  isLive?: boolean;
  betfairData: {
    tv: string | null;
    scorecard: string | null;
    commentary: string | null;
    statistics: string | null;
    highlights: string | null;
    alternateStreams: string[];
  };
}

// CSP-restricted domains that do not allow iframe embedding
const CSP_RESTRICTED_DOMAINS = [
  'turnkeyxgaming.com',
  'cloud.turnkeyxgaming.com'
];

const EnhancedLiveTVSection: React.FC<EnhancedLiveTVSectionProps> = ({
  matchId,
  match,
  isLive,
  betfairData
}) => {
  const [selectedStream, setSelectedStream] = useState(betfairData.tv || betfairData.alternateStreams[0] || null);

  // Update selected stream when betfairData changes
  useEffect(() => {
    if (betfairData.tv) {
      setSelectedStream(betfairData.tv);
    } else if (betfairData.alternateStreams && betfairData.alternateStreams.length > 0) {
      setSelectedStream(betfairData.alternateStreams[0]);
    }
  }, [betfairData]);

  // Check if URL belongs to a CSP-restricted domain
  const isCSPRestricted = (url: string | null): boolean => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return CSP_RESTRICTED_DOMAINS.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    } catch {
      // Fallback to string matching if URL parsing fails
      return CSP_RESTRICTED_DOMAINS.some(domain => url.includes(domain));
    }
  };

  // Open stream in new window
  const openStreamInNewWindow = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'width=1280,height=720,resizable=yes,scrollbars=yes');
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-destructive animate-pulse" />
            Live Match Coverage
          </div>
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              🔴 LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Video Player */}
          {selectedStream ? (
            isCSPRestricted(selectedStream) ? (
              // CSP-restricted: Show fallback UI with button (no iframe attempted)
              <div className="relative w-full bg-black rounded-lg overflow-hidden" 
                   style={{ paddingBottom: '56.25%', minHeight: '400px' }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-neutral-900 to-black">
                  <Tv className="h-16 w-16 text-primary animate-pulse" />
                  <h3 className="text-xl font-semibold text-foreground">
                    Live Stream Available
                  </h3>
                  
                  <Button
                    onClick={() => openStreamInNewWindow(selectedStream)}
                    size="lg"
                    className="mt-4"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch Live Stream
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              // Non-CSP-restricted: Render iframe normally
              <div className="relative w-full bg-black rounded-lg overflow-hidden" 
                   style={{ paddingBottom: '56.25%' }}>
                <iframe
                  key={selectedStream}
                  src={selectedStream}
                  className="absolute top-0 left-0 w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title="Live Match Stream"
                />
              </div>
            )
          ) : (
            <div className="bg-muted rounded-lg p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground font-medium">
                Live stream not available
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {isLive 
                  ? 'Stream will start soon. Please check back later.' 
                  : 'Live stream will be available when the match starts.'}
              </p>
              {betfairData.alternateStreams && betfairData.alternateStreams.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Alternative streams found but unavailable</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Try to open first alternate stream in new window
                      if (betfairData.alternateStreams[0]) {
                        window.open(betfairData.alternateStreams[0], '_blank', 'width=1280,height=720');
                      }
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Try Alternative Stream
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedLiveTVSection;
