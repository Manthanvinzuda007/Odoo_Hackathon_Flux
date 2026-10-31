import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Zap, LayoutDashboard, CreditCard, FileText, Receipt, User, LogOut, Menu, X,
} from 'lucide-react';

const navItems = [
  { to: '/portal/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/portal/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/portal/invoices', label: 'Invoices', icon: FileText },
  { to: '/portal/payments', label: 'Payments', icon: Receipt },
  { to: '/portal/profile', label: 'Profile', icon: User },
];

export default function PortalLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 h-14 border-b bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-full px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Brightloop</span>
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium ml-1">Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.firstName} {user?.lastName}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex">
        {/* Desktop nav */}
        <nav className="hidden md:flex flex-col w-52 border-r min-h-[calc(100vh-3.5rem)] p-3 gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)}>
            <nav className="absolute left-0 top-14 w-64 bg-white h-[calc(100%-3.5rem)] p-3 space-y-1 shadow-xl" onClick={(e) => e.stopPropagation()}>
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
