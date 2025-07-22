
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface CreateRummyRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (sessionId: string) => void;
}

export const CreateRummyRoomModal: React.FC<CreateRummyRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    gameType: 'points',
    entryFee: '10',
    maxPlayers: '4'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rummy_sessions')
        .insert([
          {
            created_by: user.id,
            game_type: formData.gameType,
            entry_fee: parseFloat(formData.entryFee),
            max_players: parseInt(formData.maxPlayers),
            current_players: 1,
            players: {
              user_ids: [user.id],
              user_data: [{ id: user.id, name: user.user_metadata?.full_name || 'Player' }]
            },
            prize_pool: parseFloat(formData.entryFee)
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Deduct entry fee from wallet
      if (parseFloat(formData.entryFee) > 0) {
        const { error: walletError } = await supabase.rpc('update_wallet_balance', {
          p_user_id: user.id,
          p_amount: parseFloat(formData.entryFee),
          p_type: 'debit',
          p_reason: `Created Rummy table - ID: ${data.id}`,
          p_game_type: 'rummy',
          p_game_session_id: data.id
        });

        if (walletError) throw walletError;
      }

      toast({
        title: "Table created successfully!",
        description: `Entry fee: ₹${formData.entryFee}`,
      });

      onRoomCreated(data.id);
    } catch (error: any) {
      toast({
        title: "Failed to create table",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create Rummy Table</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gameType" className="text-white">Game Type</Label>
            <Select value={formData.gameType} onValueChange={(value) => setFormData(prev => ({ ...prev, gameType: value }))}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="points">Points Rummy</SelectItem>
                <SelectItem value="pool">Pool Rummy</SelectItem>
                <SelectItem value="deals">Deals Rummy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entryFee" className="text-white">Entry Fee (₹)</Label>
            <Input
              id="entryFee"
              type="number"
              min="0"
              step="1"
              value={formData.entryFee}
              onChange={(e) => setFormData(prev => ({ ...prev, entryFee: e.target.value }))}
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPlayers" className="text-white">Maximum Players</Label>
            <Select value={formData.maxPlayers} onValueChange={(value) => setFormData(prev => ({ ...prev, maxPlayers: value }))}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="2">2 Players</SelectItem>
                <SelectItem value="3">3 Players</SelectItem>
                <SelectItem value="4">4 Players</SelectItem>
                <SelectItem value="5">5 Players</SelectItem>
                <SelectItem value="6">6 Players</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Creating...' : 'Create Table'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
