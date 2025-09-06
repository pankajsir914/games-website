import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGameContent } from '@/hooks/useGameContent';
import { FileText, Save, Globe, Search, BookOpen, FileCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GameContentManagerProps {
  gameType: string;
  gameName: string;
}

export const GameContentManager: React.FC<GameContentManagerProps> = ({ gameType, gameName }) => {
  const { content, updateContent, isUpdating } = useGameContent(gameType);
  const [formData, setFormData] = useState({
    description: {
      title: '',
      short_description: '',
      full_description: '',
    },
    rules: {
      title: 'Game Rules',
      content: '',
      sections: [],
    },
    how_to_play: {
      title: 'How to Play',
      steps: [],
      tips: [],
    },
    seo_meta: {
      meta_title: '',
      meta_description: '',
      keywords: [],
      og_title: '',
      og_description: '',
      og_image: '',
    },
  });

  useEffect(() => {
    if (content) {
      const newFormData = { ...formData };
      content.forEach((item: any) => {
        if (item.content_type && formData[item.content_type as keyof typeof formData]) {
          newFormData[item.content_type as keyof typeof formData] = item.content;
        }
      });
      setFormData(newFormData);
    }
  }, [content]);

  const handleSave = (contentType: string) => {
    updateContent({
      gameType,
      contentType,
      contentData: formData[contentType as keyof typeof formData],
    });
  };

  const handleFieldChange = (contentType: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [contentType]: {
        ...prev[contentType as keyof typeof formData],
        [field]: value,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="description" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="description">
            <FileText className="h-4 w-4 mr-2" />
            Description
          </TabsTrigger>
          <TabsTrigger value="rules">
            <BookOpen className="h-4 w-4 mr-2" />
            Rules
          </TabsTrigger>
          <TabsTrigger value="how_to_play">
            <FileCheck className="h-4 w-4 mr-2" />
            How to Play
          </TabsTrigger>
          <TabsTrigger value="seo">
            <Search className="h-4 w-4 mr-2" />
            SEO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description">
          <Card>
            <CardHeader>
              <CardTitle>Game Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.description.title}
                  onChange={(e) => handleFieldChange('description', 'title', e.target.value)}
                  placeholder={`${gameName} - Exciting Casino Game`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short-desc">Short Description</Label>
                <Textarea
                  id="short-desc"
                  value={formData.description.short_description}
                  onChange={(e) => handleFieldChange('description', 'short_description', e.target.value)}
                  placeholder="Brief description for game cards and previews..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full-desc">Full Description</Label>
                <Textarea
                  id="full-desc"
                  value={formData.description.full_description}
                  onChange={(e) => handleFieldChange('description', 'full_description', e.target.value)}
                  placeholder="Detailed game description for the game page..."
                  rows={6}
                />
              </div>

              <Button 
                onClick={() => handleSave('description')}
                disabled={isUpdating}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Description
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules">
          <Card>
            <CardHeader>
              <CardTitle>Game Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rules-content">Rules Content</Label>
                <Textarea
                  id="rules-content"
                  value={formData.rules.content}
                  onChange={(e) => handleFieldChange('rules', 'content', e.target.value)}
                  placeholder="Enter game rules in detail..."
                  rows={12}
                />
              </div>

              <Button 
                onClick={() => handleSave('rules')}
                disabled={isUpdating}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Rules
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="how_to_play">
          <Card>
            <CardHeader>
              <CardTitle>How to Play Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Steps</Label>
                <Textarea
                  value={formData.how_to_play.steps?.join('\n') || ''}
                  onChange={(e) => handleFieldChange('how_to_play', 'steps', e.target.value.split('\n').filter(s => s.trim()))}
                  placeholder="Enter steps, one per line..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">Enter each step on a new line</p>
              </div>

              <div className="space-y-2">
                <Label>Pro Tips</Label>
                <Textarea
                  value={formData.how_to_play.tips?.join('\n') || ''}
                  onChange={(e) => handleFieldChange('how_to_play', 'tips', e.target.value.split('\n').filter(s => s.trim()))}
                  placeholder="Enter tips, one per line..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">Enter each tip on a new line</p>
              </div>

              <Button 
                onClick={() => handleSave('how_to_play')}
                disabled={isUpdating}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Guide
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO & Meta Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta-title">Meta Title</Label>
                  <Input
                    id="meta-title"
                    value={formData.seo_meta.meta_title}
                    onChange={(e) => handleFieldChange('seo_meta', 'meta_title', e.target.value)}
                    placeholder="SEO optimized title..."
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.seo_meta.meta_title.length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Input
                    id="keywords"
                    value={formData.seo_meta.keywords?.join(', ') || ''}
                    onChange={(e) => handleFieldChange('seo_meta', 'keywords', e.target.value.split(',').map(k => k.trim()))}
                    placeholder="keyword1, keyword2, keyword3..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-desc">Meta Description</Label>
                <Textarea
                  id="meta-desc"
                  value={formData.seo_meta.meta_description}
                  onChange={(e) => handleFieldChange('seo_meta', 'meta_description', e.target.value)}
                  placeholder="SEO optimized description..."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.seo_meta.meta_description.length}/160 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-title">Open Graph Title</Label>
                <Input
                  id="og-title"
                  value={formData.seo_meta.og_title}
                  onChange={(e) => handleFieldChange('seo_meta', 'og_title', e.target.value)}
                  placeholder="Title for social media sharing..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-desc">Open Graph Description</Label>
                <Textarea
                  id="og-desc"
                  value={formData.seo_meta.og_description}
                  onChange={(e) => handleFieldChange('seo_meta', 'og_description', e.target.value)}
                  placeholder="Description for social media sharing..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="og-image">Open Graph Image URL</Label>
                <Input
                  id="og-image"
                  value={formData.seo_meta.og_image}
                  onChange={(e) => handleFieldChange('seo_meta', 'og_image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <Button 
                onClick={() => handleSave('seo_meta')}
                disabled={isUpdating}
              >
                <Save className="h-4 w-4 mr-2" />
                Save SEO Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};