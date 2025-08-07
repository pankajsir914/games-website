
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { UserFilters } from '@/components/admin/UserFilters';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminUsers = () => {
  const { data: adminAuth } = useAdminAuth();
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: 'all'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isMasterAdmin = adminAuth?.role === 'master_admin';
  const buttonText = isMasterAdmin ? 'Add Account' : 'Add User';

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">
              {isMasterAdmin 
                ? "Manage and monitor user and admin accounts" 
                : "Manage and monitor user accounts"
              }
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            {buttonText}
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
