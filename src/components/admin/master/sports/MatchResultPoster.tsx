import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MatchResultPosterProps {
  matches: any[];
  onPostResult: (result: any) => Promise<void>;
}

export const MatchResultPoster = ({ matches, onPostResult }: MatchResultPosterProps) => {
  const { toast } = useToast();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [result, setResult] = useState({
    winner: '',
    score: '',
    marketId: '',
    selectionId: '',
    notes: ''
  });
  const [posting, setPosting] = useState(false);

  const handlePost = async () => {
    if (!selectedMatch || !result.winner) {
      toast({
        title: "Validation Error",
        description: "Please select a match and winner",
        variant: "destructive"
      });
      return;
    }

    setPosting(true);
    try {
      await onPostResult({
        matchId: selectedMatch.id || selectedMatch.eventId,
        ...result
      });
      
      toast({
        title: "Success",
        description: "Match result posted successfully"
      });
      
      // Reset form
      setResult({
        winner: '',
        score: '',
        marketId: '',
        selectionId: '',
        notes: ''
      });
      setSelectedMatch(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post match result",
        variant: "destructive"
      });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Match Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Match</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {matches.filter(m => m.status === 'completed' || m.status === 'live').map((match, idx) => (
              <Button
                key={match.id || idx}
                variant={selectedMatch?.id === match.id ? "default" : "outline"}
                className="justify-start"
                onClick={() => setSelectedMatch(match)}
              >
                <div className="text-left">
                  <div className="font-medium">
                    {match.homeTeam || match.team1} vs {match.awayTeam || match.team2}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {match.sport} • {match.status}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Result Form */}
      {selectedMatch && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Post Match Result
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Winner</Label>
                <Select value={result.winner} onValueChange={(value) => setResult({...result, winner: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select winner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">{selectedMatch.homeTeam || 'Home Team'}</SelectItem>
                    <SelectItem value="away">{selectedMatch.awayTeam || 'Away Team'}</SelectItem>
                    <SelectItem value="draw">Draw</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Final Score</Label>
                <Input 
                  placeholder="e.g., 2-1" 
                  value={result.score}
                  onChange={(e) => setResult({...result, score: e.target.value})}
                />
              </div>

              <div>
                <Label>Market ID (Optional)</Label>
                <Input 
                  placeholder="Enter market ID" 
                  value={result.marketId}
                  onChange={(e) => setResult({...result, marketId: e.target.value})}
                />
              </div>

              <div>
                <Label>Selection ID (Optional)</Label>
                <Input 
                  placeholder="Enter selection ID" 
                  value={result.selectionId}
                  onChange={(e) => setResult({...result, selectionId: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea 
                placeholder="Additional notes about the result..." 
                value={result.notes}
                onChange={(e) => setResult({...result, notes: e.target.value})}
                rows={3}
              />
            </div>

            <Button 
              onClick={handlePost} 
              disabled={posting}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {posting ? 'Posting...' : 'Post Result'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};