
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Target, Zap, BarChart3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const ColorPredictionGameControl = () => {
  const [cheatMode, setCheatMode] = useState(false);
  const [forcedColor, setForcedColor] = useState<string | null>(null);
  const [manipulationPattern, setManipulationPattern] = useState('none');

  const colors = [
    { name: 'Red', value: 'red', color: 'bg-red-500' },
    { name: 'Green', value: 'green', color: 'bg-green-500' },
    { name: 'Blue', value: 'blue', color: 'bg-blue-500' },
    { name: 'Yellow', value: 'yellow', color: 'bg-yellow-500' },
    { name: 'Purple', value: 'purple', color: 'bg-purple-500' },
  ];

  const toggleCheatMode = () => {
    setCheatMode(!cheatMode);
    toast({
      title: cheatMode ? "Cheat Mode Disabled" : "Cheat Mode Enabled",
      description: cheatMode ? "Color prediction will run normally" : "Color manipulation is now active",
      variant: cheatMode ? "default" : "destructive"
    });
  };

  const handleForceColor = (color: string) => {
    setForcedColor(color);
    toast({
      title: "Color Forced",
      description: `Next result will be ${color}`,
      variant: "default"
    });
  };

  return (
    <div className="space-y-6">
      {/* Cheat Mode Toggle */}
      <Card className={cheatMode ? "border-red-500" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Color Prediction Manipulation
            {cheatMode && <Badge variant="destructive">CHEAT MODE ACTIVE</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="color-cheat"
              checked={cheatMode}
              onCheckedChange={toggleCheatMode}
            />
            <Label htmlFor="color-cheat">Enable Color Manipulation</Label>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors">Color Control</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Control</TabsTrigger>
          <TabsTrigger value="outcomes">Outcome Control</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Force Next Color Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {colors.map((color) => (
                    <Button
                      key={color.value}
                      variant={forcedColor === color.value ? "default" : "outline"}
                      onClick={() => handleForceColor(color.value)}
                      disabled={!cheatMode}
                      className="h-16 flex flex-col items-center gap-1"
                    >
                      <div className={`w-6 h-6 rounded-full ${color.color}`} />
                      <span className="text-xs">{color.name}</span>
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setForcedColor(null)}
                    disabled={!cheatMode}
                  >
                    Reset Color Control
                  </Button>
                  <Button 
                    variant="destructive"
                    disabled={!cheatMode}
                  >
                    Opposite Player Choice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pattern Manipulation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Manipulation Pattern</Label>
                  <Select onValueChange={setManipulationPattern} disabled={!cheatMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manipulation pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Pattern (Random)</SelectItem>
                      <SelectItem value="red-streak">Red Streak</SelectItem>
                      <SelectItem value="green-streak">Green Streak</SelectItem>
                      <SelectItem value="alternating">Alternating Colors</SelectItem>
                      <SelectItem value="avoid-popular">Avoid Most Popular Color</SelectItem>
                      <SelectItem value="favor-unpopular">Favor Least Popular Color</SelectItem>
                      <SelectItem value="house-edge">Maximum House Edge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled={!cheatMode}>
                    Start Pattern (10 rounds)
                  </Button>
                  <Button variant="outline" disabled={!cheatMode}>
                    Stop Current Pattern
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Pattern Preview</h4>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div key={i} className="w-6 h-6 bg-gray-300 rounded border" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Preview of next 10 results based on selected pattern
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Outcome Manipulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Win Rate Control</Label>
                    <div className="grid grid-cols-1 gap-1 mt-2">
                      <Button variant="outline" size="sm" disabled={!cheatMode}>
                        High Win Rate (70%+)
                      </Button>
                      <Button variant="outline" size="sm" disabled={!cheatMode}>
                        Normal Win Rate (50%)
                      </Button>
                      <Button variant="destructive" size="sm" disabled={!cheatMode}>
                        Low Win Rate (30%-)
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Betting Manipulation</Label>
                    <div className="grid grid-cols-1 gap-1 mt-2">
                      <Button variant="outline" size="sm" disabled={!cheatMode}>
                        Favor Small Bets
                      </Button>
                      <Button variant="outline" size="sm" disabled={!cheatMode}>
                        Favor Large Bets
                      </Button>
                      <Button variant="destructive" size="sm" disabled={!cheatMode}>
                        Target Large Bets
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Special Modes</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button variant="outline" disabled={!cheatMode}>
                      <Target className="mr-2 h-4 w-4" />
                      Target Specific User
                    </Button>
                    <Button variant="outline" disabled={!cheatMode}>
                      Balanced Mode (Fair Play)
                    </Button>
                    <Button variant="destructive" disabled={!cheatMode}>
                      Maximum Profit Mode
                    </Button>
                    <Button variant="outline" disabled={!cheatMode}>
                      Engagement Mode (Keep Playing)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
