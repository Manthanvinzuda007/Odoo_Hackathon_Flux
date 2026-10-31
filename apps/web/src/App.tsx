import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CustomersPage from '@/pages/customers/CustomersPage';
import ProductsPage from '@/pages/products/ProductsPage';
import PlansPage from '@/pages/plans/PlansPage';
import TaxesPage from '@/pages/taxes/TaxesPage';
import DiscountsPage from '@/pages/discounts/DiscountsPage';
import SubscriptionsPage from '@/pages/subscriptions/SubscriptionsPage';
import InvoicesPage from '@/pages/invoices/InvoicesPage';
import PaymentsPage from '@/pages/payments/PaymentsPage';
import QuotationsPage from '@/pages/quotations/QuotationsPage';
import ReportsPage from '@/pages/reports/ReportsPage';
import AuditLogsPage from '@/pages/audit-logs/AuditLogsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import PortalLayout from '@/components/layout/PortalLayout';
import PortalDashboard from '@/pages/portal/PortalDashboard';
import PortalSubscriptions from '@/pages/portal/PortalSubscriptions';
import PortalInvoices from '@/pages/portal/PortalInvoices';
import PortalPayments from '@/pages/portal/PortalPayments';
import PortalProfile from '@/pages/portal/PortalProfile';

function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading Brightloop...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'CUSTOMER' ? '/portal' : '/app'} replace /> : <LoginPage />} />

      {/* Admin/Staff Routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/app/dashboard" element={<DashboardPage />} />
          <Route path="/app/customers" element={<CustomersPage />} />
          <Route path="/app/products" element={<ProductsPage />} />
          <Route path="/app/plans" element={<PlansPage />} />
          <Route path="/app/taxes" element={<TaxesPage />} />
          <Route path="/app/discounts" element={<DiscountsPage />} />
          <Route path="/app/quotations" element={<QuotationsPage />} />
          <Route path="/app/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/app/invoices" element={<InvoicesPage />} />
          <Route path="/app/payments" element={<PaymentsPage />} />
          <Route path="/app/reports" element={<ReportsPage />} />
          <Route path="/app/audit-logs" element={<AuditLogsPage />} />
          <Route path="/app/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Customer Portal Routes */}
      <Route element={<ProtectedRoute allowedRoles={['CUSTOMER']} />}>
        <Route element={<PortalLayout />}>
          <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} />
          <Route path="/portal/dashboard" element={<PortalDashboard />} />
          <Route path="/portal/subscriptions" element={<PortalSubscriptions />} />
          <Route path="/portal/invoices" element={<PortalInvoices />} />
          <Route path="/portal/payments" element={<PortalPayments />} />
          <Route path="/portal/profile" element={<PortalProfile />} />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
