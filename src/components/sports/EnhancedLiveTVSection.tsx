import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tv, Radio, AlertCircle 
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

const EnhancedLiveTVSection: React.FC<EnhancedLiveTVSectionProps> = ({
  matchId,
  match,
  isLive,
  betfairData
}) => {
  const [selectedStream, setSelectedStream] = useState(betfairData.tv);

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
          {/* Stream Selection */}
          {betfairData.alternateStreams.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              <Button
                size="sm"
                variant={selectedStream === betfairData.tv ? 'default' : 'outline'}
                onClick={() => setSelectedStream(betfairData.tv)}
              >
                <Tv className="h-3 w-3 mr-1" />
                Primary
              </Button>
              {betfairData.alternateStreams.map((streamUrl, idx) => (
                <Button
                  key={idx}
                  size="sm"
                  variant={selectedStream === streamUrl ? 'default' : 'outline'}
                  onClick={() => setSelectedStream(streamUrl)}
                >
                  Stream {idx + 2}
                </Button>
              ))}
            </div>
          )}
          
          {/* Video Player */}
          {selectedStream ? (
            <div className="relative w-full bg-black rounded-lg overflow-hidden" 
                 style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={selectedStream}
                className="absolute top-0 left-0 w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title="Live Match Stream"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Live stream not available
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedLiveTVSection;
