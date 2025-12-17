import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGameAssets } from '@/hooks/useGameAssets';
import { Upload, X, Image, FileVideo, FileAudio, Check, Eye, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GameAssetUploaderProps {
  gameType: string;
  gameName: string;
}

const assetTypes = [
  { value: 'cover_image', label: 'Cover Image', icon: Image },
  { value: 'banner', label: 'Banner', icon: Image },
  { value: 'icon', label: 'Icon', icon: Image },
  { value: 'background', label: 'Background', icon: Image },
  { value: 'logo', label: 'Logo', icon: Image },
  { value: 'promotional', label: 'Promotional', icon: FileVideo },
];

export const GameAssetUploader: React.FC<GameAssetUploaderProps> = ({ gameType, gameName }) => {
  const { assets, uploadAsset, deleteAsset, toggleAssetStatus, isUploading } = useGameAssets(gameType);
  const [selectedAssetType, setSelectedAssetType] = useState('cover_image');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewAsset, setPreviewAsset] = useState<any>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0 && files[0]) {
        handleFileUpload(files[0]);
      }
    },
    [selectedAssetType]
  );

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'audio/mpeg'];
    if (!validTypes.includes(file.type)) {
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    uploadAsset({
      file,
      gameType,
      assetType: selectedAssetType,
    });

    setTimeout(() => {
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 500);
    }, 1000);
  };

  const getAssetIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return Image;
    if (mimeType?.startsWith('video/')) return FileVideo;
    if (mimeType?.startsWith('audio/')) return FileAudio;
    return Image;
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Game Assets for {gameName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Asset Type</label>
            <Select value={selectedAssetType} onValueChange={setSelectedAssetType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assetTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging ? "border-primary bg-primary/5" : "border-border",
              isUploading && "opacity-50 pointer-events-none"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
            <p className="text-sm text-muted-foreground mb-4">
              Supported formats: JPG, PNG, WebP, GIF, MP4, MP3
            </p>
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              className="hidden"
              id="file-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              disabled={isUploading}
            />
            <Button asChild variant="outline">
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose File
              </label>
            </Button>
          </div>

          {uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Uploaded Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets?.map((asset) => {
              const Icon = getAssetIcon(asset.mime_type || '');
              return (
                <div
                  key={asset.id}
                  className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center overflow-hidden">
                    {asset.mime_type?.startsWith('image/') ? (
                      <img
                        src={asset.asset_url}
                        alt={asset.asset_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Icon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{asset.asset_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(asset.file_size)}
                        </p>
                      </div>
                      <Badge variant={asset.is_active ? "default" : "secondary"}>
                        {asset.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      {asset.asset_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    
                    {asset.dimensions && typeof asset.dimensions === 'object' && 'width' in asset.dimensions && (
                      <p className="text-xs text-muted-foreground">
                        {(asset.dimensions as any).width} × {(asset.dimensions as any).height}px
                      </p>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewAsset(asset)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAssetStatus({ 
                          assetId: asset.id, 
                          isActive: !asset.is_active 
                        })}
                      >
                        {asset.is_active ? (
                          <X className="h-3 w-3 mr-1" />
                        ) : (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        {asset.is_active ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteAsset(asset.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {(!assets || assets.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No assets uploaded yet
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewAsset?.asset_name}</DialogTitle>
            <DialogDescription>
              {previewAsset?.asset_type.replace('_', ' ').toUpperCase()} - {formatFileSize(previewAsset?.file_size)}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewAsset?.mime_type?.startsWith('image/') && (
              <img
                src={previewAsset.asset_url}
                alt={previewAsset.asset_name}
                className="w-full rounded-lg"
              />
            )}
            {previewAsset?.mime_type?.startsWith('video/') && (
              <video
                src={previewAsset.asset_url}
                controls
                className="w-full rounded-lg"
              />
            )}
            {previewAsset?.mime_type?.startsWith('audio/') && (
              <audio
                src={previewAsset.asset_url}
                controls
                className="w-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};