import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GameAsset {
  id: string;
  game_type: string;
  asset_type: string;
  asset_url: string;
  asset_name: string;
  file_size?: number | null;
  mime_type?: string | null;
  dimensions?: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  uploaded_by?: string | null;
}

export const useGameAssets = (gameType?: string) => {
  const queryClient = useQueryClient();

  const { data: assets, isLoading, error } = useQuery({
    queryKey: ['game-assets', gameType],
    queryFn: async () => {
      let query = supabase
        .from('game_assets')
        .select('*')
        .order('created_at', { ascending: false });

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const uploadAsset = useMutation({
    mutationFn: async ({
      file,
      gameType,
      assetType,
    }: {
      file: File;
      gameType: string;
      assetType: string;
    }) => {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${gameType}/${assetType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('game-assets')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('game-assets')
        .getPublicUrl(fileName);

      // Get image dimensions if it's an image
      let dimensions = null;
      if (file.type.startsWith('image/')) {
        dimensions = await getImageDimensions(file);
      }

      // Save to database
      const { data, error } = await supabase
        .from('game_assets')
        .insert({
          game_type: gameType,
          asset_type: assetType,
          asset_url: publicUrl,
          asset_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          dimensions,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-assets'] });
      toast({
        title: "Asset Uploaded",
        description: "The game asset has been successfully uploaded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAsset = useMutation({
    mutationFn: async (assetId: string) => {
      const { error } = await supabase
        .from('game_assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-assets'] });
      toast({
        title: "Asset Deleted",
        description: "The game asset has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleAssetStatus = useMutation({
    mutationFn: async ({ assetId, isActive }: { assetId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('game_assets')
        .update({ is_active: isActive })
        .eq('id', assetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-assets'] });
      toast({
        title: "Status Updated",
        description: "Asset status has been updated.",
      });
    },
  });

  return {
    assets,
    isLoading,
    error,
    uploadAsset: uploadAsset.mutate,
    deleteAsset: deleteAsset.mutate,
    toggleAssetStatus: toggleAssetStatus.mutate,
    isUploading: uploadAsset.isPending,
  };
};

// Helper function to get image dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(url);
    };
    
    img.src = url;
  });
}