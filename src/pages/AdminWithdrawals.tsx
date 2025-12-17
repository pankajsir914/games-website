
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { WithdrawalTable } from '@/components/admin/WithdrawalTable';
import { WithdrawalStats } from '@/components/admin/WithdrawalStats';
import { WithdrawalFilters } from '@/components/admin/WithdrawalFilters';

const AdminWithdrawals = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: 'all'
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Withdrawal Approvals</h1>
          <p className="text-muted-foreground">Review and approve withdrawal requests</p>
        </div>

        <WithdrawalStats />
        <WithdrawalFilters filters={filters} onFiltersChange={setFilters} />
        <WithdrawalTable filters={filters} />
      </div>
    </AdminLayout>
  );
};

export default AdminWithdrawals;
