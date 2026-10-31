import { useQuery } from '@tanstack/react-query';
import { BarChart3, Users, TrendingUp, CreditCard, AlertCircle, ArrowUpRight, ArrowDownRight, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useFormatCurrency, formatDate, statusColor } from '@/lib/format';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const CHART_COLORS = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#EA580C', '#F97316'];

export default function DashboardPage() {
  const { user } = useAuth();
  const fmt = useFormatCurrency();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => fetch('/api/v1/reports/dashboard', {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('bl_token')}` },
    }).then((r) => r.json()),
  });

  const { data: planDist } = useQuery({
    queryKey: ['plan-distribution'],
    queryFn: () => fetch('/api/v1/reports/plan-distribution', {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('bl_token')}` },
    }).then((r) => r.json()),
  });

  const { data: subsByStatus } = useQuery({
    queryKey: ['subs-by-status'],
    queryFn: () => fetch('/api/v1/reports/subscriptions-by-status', {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('bl_token')}` },
    }).then((r) => r.json()),
  });

  const kpis = dashboard?.kpis;

  const kpiCards = kpis ? [
    { label: 'MRR', value: fmt.formatShort(kpis.mrr), icon: TrendingUp, color: 'text-blue-600' },
    { label: 'ARR', value: fmt.formatShort(kpis.arr), icon: BarChart3, color: 'text-indigo-600' },
    { label: 'Active Subscriptions', value: String(kpis.activeSubscriptions), icon: CreditCard, color: 'text-green-600' },
    { label: 'Total Customers', value: String(kpis.totalCustomers), icon: Users, color: 'text-purple-600' },
    { label: 'Total Revenue', value: fmt.formatShort(kpis.totalRevenue), icon: IndianRupee, color: 'text-emerald-600' },
    { label: 'Outstanding', value: fmt.formatShort(kpis.outstanding), icon: AlertCircle, color: 'text-amber-600' },
  ] : [];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {user?.firstName}. Here's what's happening today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-28" />
                </CardContent>
              </Card>
            ))
          : kpiCards.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                      <Icon className={`h-4 w-4 ${kpi.color}`} />
                    </div>
                    <p className="text-xl font-bold">{kpi.value}</p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Subscription Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subscriptions by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {subsByStatus ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={subsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }: { status: string; count: number }) => `${status}: ${count}`}>
                      {(subsByStatus as Array<{ status: string; count: number }>).map((_: unknown, i: number) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Skeleton className="h-[250px] w-full" />
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {planDist ? (
              <div className="space-y-3">
                {(planDist as Array<{ planName: string; count: number }>).map((p, i) => {
                  const total = (planDist as Array<{ count: number }>).reduce((s, x) => s + x.count, 0);
                  const pct = total ? Math.round((p.count / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{p.planName}</span>
                        <span className="text-sm text-muted-foreground">{p.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {(planDist as Array<unknown>).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No active subscriptions yet</p>
                )}
              </div>
            ) : (
              <Skeleton className="h-[200px] w-full" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Subscriptions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.recentActivity?.subscriptions ? (
              <div className="space-y-3">
                {(dashboard.recentActivity.subscriptions as Array<{ id: string; status: string; customer: { contactName: string; companyName?: string }; createdAt: string }>).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between py-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{sub.customer?.contactName}</p>
                      <p className="text-xs text-muted-foreground truncate">{sub.customer?.companyName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusColor(sub.status)}>{sub.status}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(sub.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Skeleton className="h-[200px] w-full" />
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard?.recentActivity?.payments ? (
              <div className="space-y-3">
                {(dashboard.recentActivity.payments as Array<{ id: string; amountPaise: number; customer: { contactName: string }; invoice: { invoiceNumber: string }; createdAt: string }>).map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.customer?.contactName}</p>
                      <p className="text-xs text-muted-foreground">{p.invoice?.invoiceNumber}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-green-600">{fmt.format(p.amountPaise)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Skeleton className="h-[200px] w-full" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
