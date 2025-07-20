
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { GameSettingsCards } from '@/components/admin/GameSettingsCards';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const AdminGameSettings = () => {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Game Settings</h1>
            <p className="text-muted-foreground">Configure game parameters and availability</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New Game
          </Button>
        </div>

        <GameSettingsCards />
      </div>
    </AdminLayout>
  );
};

export default AdminGameSettings;
