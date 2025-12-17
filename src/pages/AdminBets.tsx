import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BetLogsPage } from '@/components/admin/BetLogsPage';

const AdminBets = () => {
  return (
    <AdminLayout>
      <BetLogsPage />
    </AdminLayout>
  );
};

export default AdminBets;