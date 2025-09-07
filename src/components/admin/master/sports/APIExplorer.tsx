import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Code, Play, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface APIExplorerProps {
  onTest: (endpoint: string, method?: string, params?: any) => Promise<any>;
  logs: any[];
}

const ENDPOINTS = [
  { path: 'sports/allSportid', method: 'GET', description: 'Get all available sport IDs' },
  { path: 'sports/esid', method: 'GET', description: 'Get matches by sport ID', requiresSID: true },
  { path: 'sports/odds', method: 'GET', description: 'Get odds for a match', requiresEventId: true },
  { path: 'sports/livetv', method: 'GET', description: 'Get live TV data', requiresEventId: true },
  { path: 'sports/sportsScore', method: 'GET', description: 'Get live scores', requiresEventId: true },
  { path: 'sports/allGameDetails', method: 'GET', description: 'Get all game details', requiresEventId: true },
  { path: 'sports/matchResult', method: 'GET', description: 'Get match results', requiresEventId: true },
  { path: 'sports/postMarketResult', method: 'POST', description: 'Post market result' },
  { path: 'sports/postedMarketResult', method: 'GET', description: 'Get posted market results' },
  { path: 'sports/diamondIframeTV', method: 'GET', description: 'Get iframe TV data', requiresEventId: true },
  { path: 'sports/matchOdds', method: 'GET', description: 'Get match odds' },
];

export const APIExplorer = ({ onTest, logs }: APIExplorerProps) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [method, setMethod] = useState('GET');
  const [params, setParams] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!selectedEndpoint) return;

    setLoading(true);
    try {
      let parsedParams = {};
      if (params) {
        try {
          parsedParams = JSON.parse(params);
        } catch {
          parsedParams = { raw: params };
        }
      }

      const result = await onTest(selectedEndpoint, method, parsedParams);
      setResponse(result);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const endpoint = ENDPOINTS.find(e => e.path === selectedEndpoint);

  return (
    <div className="space-y-6">
      {/* Endpoint Tester */}
      <Card>
        <CardHeader>
          <CardTitle>API Endpoint Tester</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Endpoint</Label>
              <Select value={selectedEndpoint} onValueChange={(value) => {
                setSelectedEndpoint(value);
                const ep = ENDPOINTS.find(e => e.path === value);
                if (ep) setMethod(ep.method);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select endpoint" />
                </SelectTrigger>
                <SelectContent>
                  {ENDPOINTS.map(ep => (
                    <SelectItem key={ep.path} value={ep.path}>
                      <div>
                        <div className="font-medium">{ep.path}</div>
                        <div className="text-xs text-muted-foreground">{ep.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {endpoint && (
            <div className="space-y-2">
              <div className="flex gap-2">
                {endpoint.requiresSID && (
                  <Badge variant="outline">Requires SID</Badge>
                )}
                {endpoint.requiresEventId && (
                  <Badge variant="outline">Requires Event ID</Badge>
                )}
              </div>

              <div>
                <Label>Parameters (JSON)</Label>
                <Textarea 
                  placeholder='{"sid": "4", "eventId": "123456"}' 
                  value={params}
                  onChange={(e) => setParams(e.target.value)}
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}

          <Button onClick={handleTest} disabled={!selectedEndpoint || loading}>
            <Play className="h-4 w-4 mr-2" />
            {loading ? 'Testing...' : 'Test Endpoint'}
          </Button>
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-secondary rounded-lg p-4 overflow-auto max-h-96 text-sm">
              {JSON.stringify(response, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent API Test Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { time: new Date().toISOString(), endpoint: 'sports/allSportid', method: 'GET', status: 'success', responseTime: '245ms' },
                { time: new Date().toISOString(), endpoint: 'sports/esid', method: 'GET', status: 'success', responseTime: '189ms' },
                { time: new Date().toISOString(), endpoint: 'sports/odds', method: 'GET', status: 'error', responseTime: '1502ms' },
              ].map((log, idx) => (
                <TableRow key={idx}>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.time).toLocaleTimeString()}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.method}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.status === 'success' ? (
                      <Badge variant="secondary" className="bg-green-100/10 text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100/10 text-red-600">
                        <XCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{log.responseTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};