import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useFormatCurrency, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, FileText, Receipt, Calendar } from 'lucide-react';
import { statusColor } from '@/lib/format';

export default function PortalDashboard() {
  const { user } = useAuth();
  const { format } = useFormatCurrency();

  const { data: subs, isLoading: subsLoading } = useQuery({
    queryKey: ['portal', 'subscriptions'],
    queryFn: () => api.get('/subscriptions?pageSize=5'),
  });

  const { data: invoices, isLoading: invLoading } = useQuery({
    queryKey: ['portal', 'invoices'],
    queryFn: () => api.get('/invoices?pageSize=5'),
  });

  const { data: payments } = useQuery({
    queryKey: ['portal', 'payments'],
    queryFn: () => api.get('/payments?pageSize=5'),
  });

  const subscriptions = subs?.data || [];
  const invoiceList = invoices?.data || [];
  const paymentList = payments?.data || [];

  const activeSubs = subscriptions.filter((s: any) => s.status === 'ACTIVE').length;
  const pendingInvoices = invoiceList.filter((i: any) => ['ISSUED', 'OVERDUE'].includes(i.status)).length;
  const totalDue = invoiceList.reduce((sum: number, i: any) => sum + (i.amountDuePaise || 0), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user?.firstName}!</h1>
        <p className="text-sm text-muted-foreground mt-1">Here's an overview of your account</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Active Plans</span>
            </div>
            {subsLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{activeSubs}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Pending Invoices</span>
            </div>
            {invLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{pendingInvoices}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Amount Due</span>
            </div>
            <p className="text-2xl font-bold">{format(totalDue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Payments Made</span>
            </div>
            <p className="text-2xl font-bold">{paymentList.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Subscriptions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No subscriptions yet</p>
          ) : (
            <div className="space-y-3">
              {subscriptions.slice(0, 5).map((sub: any) => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div>
                    <p className="font-medium text-sm">{sub.lines?.[0]?.plan?.name || 'Subscription'}</p>
                    <p className="text-xs text-muted-foreground">{sub.billingInterval} · Next: {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : 'N/A'}</p>
                  </div>
                  <Badge variant={statusColor(sub.status)}>{sub.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {invoiceList.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No invoices yet</p>
          ) : (
            <div className="space-y-2">
              {invoiceList.slice(0, 5).map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="font-mono text-xs">{inv.invoiceNumber}</span>
                    <span className="text-sm text-muted-foreground ml-2">{formatDate(inv.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">{format(inv.totalPaise)}</span>
                    <Badge variant={statusColor(inv.status)} className="text-xs">{inv.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
