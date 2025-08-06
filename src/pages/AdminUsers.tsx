
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { UserFilters } from '@/components/admin/UserFilters';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

const AdminUsers = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: 'all'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage and monitor user accounts</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <UserFilters filters={filters} onFiltersChange={setFilters} />
        <UserManagementTable filters={filters} key={refreshKey} />
        
        <CreateUserModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onUserCreated={() => {
            setRefreshKey(prev => prev + 1);
          }}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
