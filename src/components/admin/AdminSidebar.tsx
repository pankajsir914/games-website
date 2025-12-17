
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  CheckCircle,
  Crown,
  X,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
<<<<<<< HEAD
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard', showForMaster: false },
  { icon: Users, label: 'Users', href: '/admin/users', showForMaster: true },
  { icon: CreditCard, label: 'Payments', href: '/admin/payments', showForMaster: false },
  { icon: CheckCircle, label: 'Withdrawals', href: '/admin/withdrawals', showForMaster: false },
  { icon: CreditCard, label: 'Transactions', href: '/admin/transactions', showForMaster: false },
  { icon: Users, label: 'Bet Logs', href: '/admin/bets', showForMaster: false },
=======
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: CreditCard, label: 'Payments', href: '/admin/payments' },
  { icon: CheckCircle, label: 'Withdrawals', href: '/admin/withdrawals' },
  { icon: CreditCard, label: 'Transactions', href: '/admin/transactions' },
  { icon: Users, label: 'Bet Logs', href: '/admin/bets' },
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
];

export const AdminSidebar = ({ isOpen, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const { data: adminAuth } = useAdminAuth();
  
  const isMasterAdmin = adminAuth?.role === 'master_admin';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:w-64",
        "w-[280px] sm:w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-primary rounded-lg p-2">
              <Crown className="h-6 w-6 text-gaming-gold-foreground" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Admin Panel
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-4">
          <div className="space-y-2">
            {/* Master Admin Console - Only visible to master admins */}
            {isMasterAdmin && (
              <Link
                to="/master-admin"
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                  location.pathname === '/master-admin'
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Zap className="mr-3 h-5 w-5" />
                Master Console
              </Link>
            )}
            
            {menuItems.map((item) => {
<<<<<<< HEAD
              // Hide Payments, Withdrawals, Transactions for master admin
              if (isMasterAdmin && !item.showForMaster) {
                return null;
              }
              
=======
>>>>>>> 4547c8ad80084463d58b164f1cebe7081ac0d515
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};
