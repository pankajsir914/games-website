import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { PaymentRequestsTable } from '@/components/admin/PaymentRequestsTable';
import { AdminPaymentMethods } from '@/components/admin/AdminPaymentMethods';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useMasterAdminFinance } from '@/hooks/useMasterAdminFinance';
import { CreditCard, TrendingUp, Clock, CheckCircle, Settings, Receipt, Filter } from 'lucide-react';

const AdminPayments = () => {
  const { financeData } = useMasterAdminFinance();
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateRange: 'all'
  });

  const stats = [
    {
      title: 'Pending Deposits',
      value: financeData?.pending_deposits || 0,
      icon: Clock,
      description: 'Awaiting approval',
      color: 'text-yellow-600'
    },
    {
      title: 'Today\'s Deposits',
      value: `₹${financeData?.total_platform_balance?.toLocaleString() || '0'}`,
      icon: TrendingUp,
      description: 'Total platform balance',
      color: 'text-gaming-success'
    },
    {
      title: 'Approved Today',
      value: financeData?.payment_requests?.filter(r => r.status === 'approved' && 
        new Date(r.created_at).toDateString() === new Date().toDateString()).length || 0,
      icon: CheckCircle,
      description: 'Successfully processed',
      color: 'text-gaming-success'
    },
    {
      title: 'Total Requests',
      value: financeData?.payment_requests?.length || 0,
      icon: CreditCard,
      description: 'All payment requests',
      color: 'text-primary'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Management</h1>
          <p className="text-muted-foreground">Manage payment methods and review payment requests</p>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Payment Requests
            </TabsTrigger>
            <TabsTrigger value="methods" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Payment Methods
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Filters - Desktop */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>Filters</CardTitle>
                <CardDescription>Filter payment requests by status and search criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">Search</label>
                    <Input
                      placeholder="Search by user or request ID..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date Range</label>
                    <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Floating Filter Button - Mobile */}
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  size="lg"
                  className="fixed bottom-6 right-6 md:hidden z-50 rounded-full h-14 w-14 shadow-lg"
                >
                  <Filter className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>Filter payment requests by status and search criteria</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 mt-4">
                  <div>
                    <label className="text-sm font-medium">Search</label>
                    <Input
                      placeholder="Search by user or request ID..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date Range</label>
                    <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="All time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This week</SelectItem>
                        <SelectItem value="month">This month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <PaymentRequestsTable filters={filters} />
          </TabsContent>

          <TabsContent value="methods">
            <AdminPaymentMethods />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminPayments;