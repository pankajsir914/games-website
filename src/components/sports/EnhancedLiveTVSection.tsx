import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Tv, FileText, MessageSquare, BarChart3, 
  Video, Radio, AlertCircle 
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
  const [activeTab, setActiveTab] = useState('stream');

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="stream" className="flex items-center gap-2">
              <Tv className="h-4 w-4" />
              <span className="hidden sm:inline">Stream</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="scorecard" 
              className="flex items-center gap-2"
              disabled={!betfairData.scorecard}
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Scorecard</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="commentary" 
              className="flex items-center gap-2"
              disabled={!betfairData.commentary}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Commentary</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="statistics" 
              className="flex items-center gap-2"
              disabled={!betfairData.statistics}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Stats</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="highlights" 
              className="flex items-center gap-2"
              disabled={!betfairData.highlights}
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Highlights</span>
            </TabsTrigger>
          </TabsList>

          {/* Stream Tab Content */}
          <TabsContent value="stream" className="space-y-4">
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
          </TabsContent>

          {/* Scorecard Tab Content */}
          <TabsContent value="scorecard">
            {betfairData.scorecard ? (
              <div className="relative w-full bg-background rounded-lg overflow-hidden border" 
                   style={{ minHeight: '600px' }}>
                <iframe
                  src={betfairData.scorecard}
                  className="w-full h-full"
                  style={{ minHeight: '600px' }}
                  title="Live Scorecard"
                />
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Scorecard not available
                </p>
              </div>
            )}
          </TabsContent>

          {/* Commentary Tab Content */}
          <TabsContent value="commentary">
            {betfairData.commentary ? (
              <div className="relative w-full bg-background rounded-lg overflow-hidden border" 
                   style={{ minHeight: '500px' }}>
                <iframe
                  src={betfairData.commentary}
                  className="w-full h-full"
                  style={{ minHeight: '500px' }}
                  title="Live Commentary"
                />
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Commentary not available
                </p>
              </div>
            )}
          </TabsContent>

          {/* Statistics Tab Content */}
          <TabsContent value="statistics">
            {betfairData.statistics ? (
              <div className="relative w-full bg-background rounded-lg overflow-hidden border" 
                   style={{ minHeight: '500px' }}>
                <iframe
                  src={betfairData.statistics}
                  className="w-full h-full"
                  style={{ minHeight: '500px' }}
                  title="Match Statistics"
                />
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Statistics not available
                </p>
              </div>
            )}
          </TabsContent>

          {/* Highlights Tab Content */}
          <TabsContent value="highlights">
            {betfairData.highlights ? (
              <div className="relative w-full bg-black rounded-lg overflow-hidden" 
                   style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={betfairData.highlights}
                  className="absolute top-0 left-0 w-full h-full"
                  allowFullScreen
                  title="Match Highlights"
                />
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-12 text-center">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Highlights will be available after the match
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EnhancedLiveTVSection;
