import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GameContent {
  id: string;
  game_type: string;
  content_type: string;
  content: any;
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useGameContent = (gameType?: string) => {
  const queryClient = useQueryClient();

  const { data: content, isLoading, error } = useQuery({
    queryKey: ['game-content', gameType],
    queryFn: async () => {
      let query = supabase
        .from('game_content')
        .select('*')
        .order('content_type');

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateContent = useMutation({
    mutationFn: async ({
      gameType,
      contentType,
      contentData,
    }: {
      gameType: string;
      contentType: string;
      contentData: any;
    }) => {
      // Check if content exists
      const { data: existing } = await supabase
        .from('game_content')
        .select('id')
        .eq('game_type', gameType)
        .eq('content_type', contentType)
        .single();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('game_content')
          .update({ 
            content: contentData,
            updated_by: (await supabase.auth.getUser()).data.user?.id
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('game_content')
          .insert({
            game_type: gameType,
            content_type: contentType,
            content: contentData,
            updated_by: (await supabase.auth.getUser()).data.user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game-content'] });
      toast({
        title: "Content Updated",
        description: "Game content has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    content,
    isLoading,
    error,
    updateContent: updateContent.mutate,
    isUpdating: updateContent.isPending,
  };
};