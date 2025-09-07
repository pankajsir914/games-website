import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SIDConfig {
  id?: string;
  sport_type: string;
  sid: string;
  label?: string;
  is_active: boolean;
  is_default?: boolean;
  auto_sync: boolean;
  sync_interval: number;
  last_sync?: string;
  created_at?: string;
}

interface SIDManagerProps {
  configs: SIDConfig[];
  loading: boolean;
  onSave: (config: SIDConfig) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onFetchSports: () => Promise<void>;
}

const SPORT_TYPES = [
  { value: 'cricket', label: 'Cricket', icon: '🏏' },
  { value: 'football', label: 'Football', icon: '⚽' },
  { value: 'tennis', label: 'Tennis', icon: '🎾' },
  { value: 'basketball', label: 'Basketball', icon: '🏀' },
  { value: 'hockey', label: 'Hockey', icon: '🏒' },
  { value: 'baseball', label: 'Baseball', icon: '⚾' },
  { value: 'kabaddi', label: 'Kabaddi', icon: '🤼' },
  { value: 'table-tennis', label: 'Table Tennis', icon: '🏓' },
  { value: 'boxing', label: 'Boxing', icon: '🥊' },
];

export const SIDManager = ({ configs, loading, onSave, onDelete, onFetchSports }: SIDManagerProps) => {
  const { toast } = useToast();
  const [newConfig, setNewConfig] = useState<SIDConfig>({
    sport_type: '',
    sid: '',
    label: '',
    is_active: true,
    is_default: false,
    auto_sync: false,
    sync_interval: 60
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!newConfig.sport_type || !newConfig.sid) {
      toast({
        title: "Validation Error",
        description: "Please select a sport and enter SID",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await onSave(newConfig);
      setNewConfig({
        sport_type: '',
        sid: '',
        label: '',
        is_active: true,
        is_default: false,
        auto_sync: false,
        sync_interval: 60
      });
      toast({
        title: "Success",
        description: "SID configuration saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save SID configuration",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (config: SIDConfig) => {
    await onSave({
      ...config,
      is_active: !config.is_active
    });
  };

  return (
    <div className="space-y-6">
      {/* Add New SID */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Add New SID Configuration
            <Button onClick={onFetchSports} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Fetch Available SIDs
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Sport Type</Label>
              <Select value={newConfig.sport_type} onValueChange={(value) => setNewConfig({...newConfig, sport_type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORT_TYPES.map(sport => (
                    <SelectItem key={sport.value} value={sport.value}>
                      <span className="flex items-center gap-2">
                        <span>{sport.icon}</span>
                        {sport.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>SID</Label>
              <Input 
                placeholder="Enter SID (e.g., 4)" 
                value={newConfig.sid}
                onChange={(e) => setNewConfig({...newConfig, sid: e.target.value})}
              />
            </div>
            <div>
              <Label>Label (optional)</Label>
              <Input 
                placeholder="e.g., Default Cricket"
                value={newConfig.label || ''}
                onChange={(e) => setNewConfig({ ...newConfig, label: e.target.value })}
              />
            </div>

            <div>
              <Label>Sync Interval (seconds)</Label>
              <Input 
                type="number" 
                min="30"
                value={newConfig.sync_interval}
                onChange={(e) => setNewConfig({...newConfig, sync_interval: parseInt(e.target.value) || 60})}
              />
            </div>

            <div className="flex items-end gap-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={newConfig.auto_sync}
                  onCheckedChange={(checked) => setNewConfig({...newConfig, auto_sync: checked})}
                />
                <Label>Auto Sync</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={!!newConfig.is_default}
                  onCheckedChange={(checked) => setNewConfig({ ...newConfig, is_default: checked })}
                />
                <Label>Default</Label>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing SIDs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configured SIDs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No SID configurations found. Add one above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => {
                const sport = SPORT_TYPES.find(s => s.value === config.sport_type);
                return (
                  <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{sport?.icon || '🏆'}</span>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {sport?.label || config.sport_type}
                          {config.is_default && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          SID: {config.sid}
                          {config.label ? ` • ${config.label}` : ''}
                        </div>
                      </div>
                      {config.is_active ? (
                        <Badge variant="secondary" className="bg-green-100/10 text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100/10 text-red-600">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                      {config.auto_sync && (
                        <Badge variant="outline">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Auto-sync: {config.sync_interval}s
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={config.is_active}
                        onCheckedChange={() => handleToggle(config)}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => config.id && onDelete(config.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
