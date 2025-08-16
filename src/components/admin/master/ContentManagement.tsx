import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Save, 
  Edit, 
  Eye,
  Globe,
  HelpCircle,
  Shield,
  BookOpen,
  Image,
  Video,
  Plus
} from 'lucide-react';

export const ContentManagement = () => {
  const [pages] = useState([
    {
      id: 1,
      title: 'Privacy Policy',
      type: 'legal',
      status: 'published',
      lastUpdated: '2024-01-10',
      wordCount: 2847
    },
    {
      id: 2,
      title: 'Terms of Service',
      type: 'legal',
      status: 'published',
      lastUpdated: '2024-01-10',
      wordCount: 3521
    },
    {
      id: 3,
      title: 'About Us',
      type: 'info',
      status: 'published',
      lastUpdated: '2024-01-05',
      wordCount: 892
    },
    {
      id: 4,
      title: 'How to Play - Color Prediction',
      type: 'help',
      status: 'draft',
      lastUpdated: '2024-01-15',
      wordCount: 1245
    }
  ]);

  const [faqs] = useState([
    {
      id: 1,
      question: 'How do I deposit money?',
      answer: 'You can deposit money using UPI, Net Banking, or Debit/Credit Cards.',
      category: 'payments',
      status: 'published'
    },
    {
      id: 2,
      question: 'What is the minimum withdrawal amount?',
      answer: 'The minimum withdrawal amount is ₹500.',
      category: 'payments',
      status: 'published'
    },
    {
      id: 3,
      question: 'How do I withdraw my winnings?',
      answer: 'You can withdraw your winnings through the wallet section using your registered bank account.',
      category: 'account',
      status: 'published'
    }
  ]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-gaming-success text-gaming-success-foreground">Published</Badge>;
      case 'draft': return <Badge className="bg-orange-500 text-white">Draft</Badge>;
      case 'archived': return <Badge className="bg-muted text-muted-foreground">Archived</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'legal': return <Shield className="h-4 w-4 text-gaming-danger" />;
      case 'info': return <Globe className="h-4 w-4 text-primary" />;
      case 'help': return <HelpCircle className="h-4 w-4 text-gaming-gold" />;
      default: return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Content Management System</h2>
          <p className="text-muted-foreground">Manage website content, policies, FAQs, and game instructions</p>
        </div>
        <Button className="bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
          <Plus className="h-4 w-4 mr-2" />
          Create New Page
        </Button>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Editor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-6">
          {/* Page Management */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Website Pages
              </CardTitle>
              <CardDescription>Manage static pages and legal documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pages.map((page) => (
                  <div key={page.id} className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getTypeIcon(page.type)}
                      </div>
                      
                      <div>
                        <h4 className="font-semibold">{page.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {page.wordCount} words • Last updated: {page.lastUpdated}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {getStatusBadge(page.status)}
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-gaming-danger" />
                  Legal Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Privacy Policy
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Terms of Service
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Cookie Policy
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="h-5 w-5 text-gaming-gold" />
                  Game Instructions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Color Prediction Guide
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Aviator Rules
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Andar Bahar Guide
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-primary" />
                  Company Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  About Us
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Contact Information
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="h-4 w-4 mr-2" />
                  Responsible Gaming
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-6">
          {/* FAQ Management */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-gaming-gold" />
                FAQ Management
              </CardTitle>
              <CardDescription>Manage frequently asked questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.id} className="p-4 bg-background/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{faq.question}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{faq.answer}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {faq.category}
                          </Badge>
                          {getStatusBadge(faq.status)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button className="mt-4 bg-gaming-gold text-gaming-gold-foreground hover:bg-gaming-gold/90">
                <Plus className="h-4 w-4 mr-2" />
                Add New FAQ
              </Button>
            </CardContent>
          </Card>

          {/* FAQ Categories */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle>FAQ Categories</CardTitle>
              <CardDescription>Organize FAQs by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">8</div>
                  <div className="text-sm text-muted-foreground">Account</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-gaming-gold">12</div>
                  <div className="text-sm text-muted-foreground">Payments</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-gaming-success">15</div>
                  <div className="text-sm text-muted-foreground">Games</div>
                </div>
                <div className="text-center p-4 bg-background/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-500">6</div>
                  <div className="text-sm text-muted-foreground">Technical</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          {/* Media Library */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-purple-500" />
                Media Library
              </CardTitle>
              <CardDescription>Manage images, videos, and other media files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="aspect-square bg-background/50 rounded-lg flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="aspect-square bg-background/50 rounded-lg flex items-center justify-center">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="aspect-square bg-background/50 rounded-lg flex items-center justify-center border-2 border-dashed border-primary">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-background/50 rounded-lg">
                <h4 className="font-semibold mb-2">Upload New Media</h4>
                <div className="flex gap-4">
                  <Button variant="outline">
                    <Image className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button variant="outline">
                    <Video className="h-4 w-4 mr-2" />
                    Upload Video
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          {/* Content Editor */}
          <Card className="bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-gaming-gold" />
                Content Editor
              </CardTitle>
              <CardDescription>Create and edit content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="page-title">Page Title</Label>
                <Input id="page-title" placeholder="Enter page title" className="bg-background" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="page-content">Content</Label>
                <Textarea 
                  id="page-content" 
                  placeholder="Enter page content..." 
                  className="bg-background min-h-[200px]" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="page-type">Page Type</Label>
                  <select className="w-full px-3 py-2 bg-background border border-border rounded-md">
                    <option>Information</option>
                    <option>Legal</option>
                    <option>Help</option>
                    <option>Game Guide</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="page-status">Status</Label>
                  <select className="w-full px-3 py-2 bg-background border border-border rounded-md">
                    <option>Draft</option>
                    <option>Published</option>
                    <option>Archived</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button className="bg-gaming-success text-gaming-success-foreground hover:bg-gaming-success/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save & Publish
                </Button>
                <Button variant="outline">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};