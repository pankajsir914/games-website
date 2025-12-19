import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DiamondTable {
  id: string;
  table_id: string;
  table_name: string;
  image_url?: string | null;
  status: string;
  player_count: number;
  created_at: string;
  last_updated: string;
}

export const DiamondCasinoTableManager = () => {
  const { toast } = useToast();
  const [tables, setTables] = useState<DiamondTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<DiamondTable | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    table_id: '',
    table_name: '',
    status: 'active',
    player_count: 0,
    image_url: '',
  });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diamond_casino_tables')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTables(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch tables',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // Upload to game-assets storage bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `casino-tables/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('game-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('game-assets')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(error.message || 'Failed to upload image');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.table_id.trim() || !formData.table_name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Table ID and Table Name are required',
          variant: 'destructive',
        });
        return;
      }

      setUploading(true);

      let imageUrl = formData.image_url;

      // Upload image if new file selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const tableData = {
        table_id: formData.table_id.trim(),
        table_name: formData.table_name.trim(),
        status: formData.status,
        player_count: formData.player_count,
        image_url: imageUrl || null,
        last_updated: new Date().toISOString(),
      };

      if (editingTable) {
        // Update existing table
        const { error } = await supabase
          .from('diamond_casino_tables')
          .update(tableData)
          .eq('id', editingTable.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Table updated successfully',
        });
      } else {
        // Check if table_id already exists
        const { data: existing } = await supabase
          .from('diamond_casino_tables')
          .select('table_id')
          .eq('table_id', tableData.table_id)
          .single();

        if (existing) {
          toast({
            title: 'Error',
            description: 'Table ID already exists',
            variant: 'destructive',
          });
          return;
        }

        // Insert new table
        const { error } = await supabase
          .from('diamond_casino_tables')
          .insert(tableData);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Table added successfully',
        });
      }

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
      fetchTables();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save table',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (table: DiamondTable) => {
    setEditingTable(table);
    setFormData({
      table_id: table.table_id,
      table_name: table.table_name,
      status: table.status,
      player_count: table.player_count || 0,
      image_url: table.image_url || '',
    });
    setImagePreviewUrl(table.image_url || null);
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, tableName: string) => {
    if (!confirm(`Are you sure you want to delete "${tableName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('diamond_casino_tables')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Table deleted successfully',
      });

      fetchTables();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete table',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      table_id: '',
      table_name: '',
      status: 'active',
      player_count: 0,
      image_url: '',
    });
    setEditingTable(null);
    setImageFile(null);
    setImagePreviewUrl(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Diamond Casino Tables Management</CardTitle>
              <CardDescription>
                Manage casino tables, upload images, and update table data
              </CardDescription>
            </div>
            <Button onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Table ID</TableHead>
                    <TableHead>Table Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Players</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No tables found. Click "Add Table" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    tables.map((table) => (
                      <TableRow key={table.id}>
                        <TableCell>
                          {table.image_url ? (
                            <div className="relative w-16 h-16">
                              <img
                                src={table.image_url}
                                alt={table.table_name}
                                className="w-full h-full object-cover rounded"
                                onClick={() => setPreviewImage(table.image_url || null)}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{table.table_id}</TableCell>
                        <TableCell className="font-medium">{table.table_name}</TableCell>
                        <TableCell>
                          <Badge variant={table.status === 'active' ? 'default' : 'secondary'}>
                            {table.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{table.player_count || 0}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(table)}
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(table.id, table.table_name)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTable ? 'Edit Table' : 'Add New Table'}
            </DialogTitle>
            <DialogDescription>
              {editingTable
                ? 'Update table information and image'
                : 'Create a new casino table with image and details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="table_id">Table ID *</Label>
                <Input
                  id="table_id"
                  value={formData.table_id}
                  onChange={(e) => setFormData({ ...formData, table_id: e.target.value })}
                  placeholder="e.g., baccarat-1"
                  disabled={!!editingTable}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Unique identifier (cannot be changed after creation)
                </p>
              </div>

              <div>
                <Label htmlFor="table_name">Table Name *</Label>
                <Input
                  id="table_name"
                  value={formData.table_name}
                  onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
                  placeholder="e.g., Baccarat Classic"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="player_count">Player Count</Label>
                <Input
                  id="player_count"
                  type="number"
                  value={formData.player_count}
                  onChange={(e) =>
                    setFormData({ ...formData, player_count: parseInt(e.target.value) || 0 })
                  }
                  min="0"
                />
              </div>
            </div>

            <div>
              <Label>Table Image</Label>
              <div className="mt-2 space-y-4">
                {imagePreviewUrl && (
                  <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {imageFile ? 'Change Image' : 'Upload Image'}
                  </Button>

                  {imagePreviewUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreviewUrl(editingTable?.image_url || null);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  Recommended: Square images (1:1 ratio), Max 5MB (JPG, PNG, WebP)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="image_url">Or Enter Image URL</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => {
                  setFormData({ ...formData, image_url: e.target.value });
                  if (e.target.value) {
                    setImagePreviewUrl(e.target.value);
                  }
                }}
                placeholder="https://example.com/image.jpg or /path/to/image.jpg"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter direct URL or path from public folder
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingTable ? 'Update' : 'Create'} Table
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="mt-4">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

