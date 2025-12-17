
import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TransactionTable } from '@/components/admin/TransactionTable';
import { TransactionFilters } from '@/components/admin/TransactionFilters';
import { TransactionStats } from '@/components/admin/TransactionStats';

const AdminTransactions = () => {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    status: 'all',
    dateRange: 'all'
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground">Monitor all platform transactions</p>
        </div>

        <TransactionStats />
        <TransactionFilters filters={filters} onFiltersChange={setFilters} />
        <TransactionTable filters={filters} />
      </div>
    </AdminLayout>
  );
};

export default AdminTransactions;
