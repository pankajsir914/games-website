import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Code, Play, Clock, CheckCircle, XCircle, Save, Database, Trash2, Eye, Copy, Tags, FileText, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface APIExplorerProps {
  onTest: (endpoint: string, method?: string, params?: any) => Promise<any>;
  onStore?: (endpoint: string, method: string, params: any, response: any, responseTime: number, notes?: string, tags?: string[]) => Promise<any>;
  onGetStored?: (filters?: any) => Promise<any[]>;
  onDeleteStored?: (id: string) => Promise<boolean>;
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

export const APIExplorer = ({ onTest, onStore, onGetStored, onDeleteStored, logs }: APIExplorerProps) => {
  const { toast } = useToast();
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [method, setMethod] = useState('GET');
  const [params, setParams] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [responseMetadata, setResponseMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showStoreDialog, setShowStoreDialog] = useState(false);
  const [storeNotes, setStoreNotes] = useState('');
  const [storeTags, setStoreTags] = useState('');
  const [storedResponses, setStoredResponses] = useState<any[]>([]);
  const [selectedStoredResponse, setSelectedStoredResponse] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('test');

  // Fetch stored responses on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'stored' && onGetStored) {
      fetchStoredResponses();
    }
  }, [activeTab, onGetStored]);

  const fetchStoredResponses = async () => {
    if (!onGetStored) return;
    try {
      const data = await onGetStored({ search: searchQuery });
      setStoredResponses(data || []);
    } catch (error) {
      console.error('Failed to fetch stored responses:', error);
    }
  };

  const handleTest = async () => {
    if (!selectedEndpoint) return;

    setLoading(true);
    setResponse(null);
    setResponseMetadata(null);
    
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
      
      // Check if result has metadata (new format) or is just the response (old format)
      if (result?.response !== undefined && result?.metadata !== undefined) {
        setResponse(result.response);
        setResponseMetadata(result.metadata);
      } else {
        setResponse(result);
        setResponseMetadata({
          endpoint: selectedEndpoint,
          method,
          params: parsedParams,
          response_time_ms: 0,
          status_code: result?.success ? 200 : 400
        });
      }
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleStore = async () => {
    if (!onStore || !response || !responseMetadata) return;

    try {
      const tagsArray = storeTags ? storeTags.split(',').map(t => t.trim()).filter(Boolean) : [];
      
      await onStore(
        responseMetadata.endpoint,
        responseMetadata.method,
        responseMetadata.params,
        response,
        responseMetadata.response_time_ms,
        storeNotes,
        tagsArray
      );
      
      setShowStoreDialog(false);
      setStoreNotes('');
      setStoreTags('');
      
      // Refresh stored responses
      if (activeTab === 'stored') {
        await fetchStoredResponses();
      }
    } catch (error) {
      console.error('Failed to store response:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteStored) return;
    
    try {
      const success = await onDeleteStored(id);
      if (success) {
        await fetchStoredResponses();
      }
    } catch (error) {
      console.error('Failed to delete stored response:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Response copied to clipboard"
    });
  };

  const endpoint = ENDPOINTS.find(e => e.path === selectedEndpoint);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="test">
            <Code className="h-4 w-4 mr-2" />
            API Tester
          </TabsTrigger>
          <TabsTrigger value="stored">
            <Database className="h-4 w-4 mr-2" />
            Stored Responses ({storedResponses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
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
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Response
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    {onStore && response?.success && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowStoreDialog(true)}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Store in Database
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-secondary rounded-lg p-4 overflow-auto max-h-96 text-sm">
                  {JSON.stringify(response, null, 2)}
                </pre>
                {responseMetadata && (
                  <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                    <span>Status: {responseMetadata.status_code}</span>
                    <span>Response Time: {responseMetadata.response_time_ms}ms</span>
                    <span>Method: {responseMetadata.method}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stored" className="space-y-6">
          {/* Stored Responses */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Stored API Responses
                </CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search endpoints..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchStoredResponses}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storedResponses.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.method}</Badge>
                        </TableCell>
                        <TableCell>
                          {log.status_code === 200 ? (
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
                        <TableCell className="text-sm">{log.response_time_ms}ms</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedStoredResponse(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(log.response, null, 2))}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {onDeleteStored && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(log.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Store Dialog */}
      <Dialog open={showStoreDialog} onOpenChange={setShowStoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Store API Response</DialogTitle>
            <DialogDescription>
              Add notes and tags to help organize this API response
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Add notes about this response..."
                value={storeNotes}
                onChange={(e) => setStoreNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                placeholder="e.g., cricket, live, production"
                value={storeTags}
                onChange={(e) => setStoreTags(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStoreDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStore}>
              <Save className="h-4 w-4 mr-2" />
              Store Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Stored Response Dialog */}
      <Dialog open={!!selectedStoredResponse} onOpenChange={() => setSelectedStoredResponse(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Stored API Response Details</DialogTitle>
          </DialogHeader>
          {selectedStoredResponse && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Endpoint</Label>
                  <p className="font-mono">{selectedStoredResponse.endpoint}</p>
                </div>
                <div>
                  <Label>Method</Label>
                  <Badge variant="outline">{selectedStoredResponse.method}</Badge>
                </div>
                <div>
                  <Label>Status Code</Label>
                  <p>{selectedStoredResponse.status_code}</p>
                </div>
                <div>
                  <Label>Response Time</Label>
                  <p>{selectedStoredResponse.response_time_ms}ms</p>
                </div>
                <div>
                  <Label>Stored At</Label>
                  <p>{new Date(selectedStoredResponse.created_at).toLocaleString()}</p>
                </div>
                {selectedStoredResponse.notes && (
                  <div className="col-span-2">
                    <Label>Notes</Label>
                    <p>{selectedStoredResponse.notes}</p>
                  </div>
                )}
                {selectedStoredResponse.tags && selectedStoredResponse.tags.length > 0 && (
                  <div className="col-span-2">
                    <Label>Tags</Label>
                    <div className="flex gap-1 mt-1">
                      {selectedStoredResponse.tags.map((tag: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {selectedStoredResponse.params && (
                <div>
                  <Label>Parameters</Label>
                  <pre className="bg-secondary rounded-lg p-2 overflow-auto max-h-32 text-sm mt-1">
                    {JSON.stringify(selectedStoredResponse.params, null, 2)}
                  </pre>
                </div>
              )}
              
              <div>
                <Label>Response</Label>
                <pre className="bg-secondary rounded-lg p-4 overflow-auto max-h-96 text-sm mt-1">
                  {JSON.stringify(selectedStoredResponse.response, null, 2)}
                </pre>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedStoredResponse(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};