import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, CreditCard, FileText, Receipt,
  BarChart3, Settings, Shield, Tag, Percent, FileCheck, ScrollText,
  ChevronLeft, ChevronRight, LogOut, Zap, Menu, X, Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF'] },
  { type: 'divider' as const, label: 'Management' },
  { name: 'Customers', href: '/app/customers', icon: Users, roles: ['ADMIN', 'STAFF'] },
  { name: 'Products', href: '/app/products', icon: Package, roles: ['ADMIN', 'STAFF'] },
  { name: 'Plans', href: '/app/plans', icon: CreditCard, roles: ['ADMIN', 'STAFF'] },
  { name: 'Subscriptions', href: '/app/subscriptions', icon: ScrollText, roles: ['ADMIN', 'STAFF'] },
  { type: 'divider' as const, label: 'Billing' },
  { name: 'Invoices', href: '/app/invoices', icon: FileText, roles: ['ADMIN', 'STAFF'] },
  { name: 'Payments', href: '/app/payments', icon: Receipt, roles: ['ADMIN', 'STAFF'] },
  { type: 'divider' as const, label: 'Configuration' },
  { name: 'Taxes', href: '/app/taxes', icon: Tag, roles: ['ADMIN'] },
  { name: 'Discounts', href: '/app/discounts', icon: Percent, roles: ['ADMIN'] },
  { type: 'divider' as const, label: 'Analytics' },
  { name: 'Reports', href: '/app/reports', icon: BarChart3, roles: ['ADMIN', 'STAFF'] },
  { name: 'Audit Logs', href: '/app/audit-logs', icon: Shield, roles: ['ADMIN'] },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNav = navigation.filter((item) => {
    if ('type' in item) return true;
    return !item.roles || item.roles.includes(user?.role || '');
  });

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && <span className="text-lg font-bold">Brightloop</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {filteredNav.map((item, idx) => {
          if ('type' in item) {
            if (collapsed) return <div key={idx} className="my-2 border-t" />;
            return (
              <div key={idx} className="px-3 pt-4 pb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </span>
              </div>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  collapsed && 'justify-center px-2',
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t p-3">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" onClick={logout} className="shrink-0 cursor-pointer" aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r bg-card transition-all duration-200',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-8 items-center justify-center border-t text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card shadow-xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="cursor-pointer" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-bold">Brightloop</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
