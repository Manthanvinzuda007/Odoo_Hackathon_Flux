import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useFormatCurrency } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import {
  TrendingUp, IndianRupee, Users, FileText, Receipt, AlertTriangle,
} from 'lucide-react';

const COLORS = ['#2563EB', '#EA580C', '#16A34A', '#EAB308', '#8B5CF6', '#EC4899', '#06B6D4', '#78716C'];

export default function ReportsPage() {
  const { format, formatShort } = useFormatCurrency();

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => api.get('/reports/dashboard'),
  });

  const { data: revenueByMonth } = useQuery({
    queryKey: ['reports', 'revenue-by-month'],
    queryFn: () => api.get('/reports/revenue-by-month'),
  });

  const { data: subsByStatus } = useQuery({
    queryKey: ['reports', 'subscriptions-by-status'],
    queryFn: () => api.get('/reports/subscriptions-by-status'),
  });

  const { data: invoicesByStatus } = useQuery({
    queryKey: ['reports', 'invoices-by-status'],
    queryFn: () => api.get('/reports/invoices-by-status'),
  });

  const { data: planDist } = useQuery({
    queryKey: ['reports', 'plan-distribution'],
    queryFn: () => api.get('/reports/plan-distribution'),
  });

  if (dashLoading) {
    return (
      <div className="p-6 space-y-6">
        <div><Skeleton className="h-8 w-48" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Monthly Recurring Revenue', value: format(dashboard?.mrr || 0), icon: TrendingUp, color: 'text-primary' },
    { label: 'Annual Recurring Revenue', value: format(dashboard?.arr || 0), icon: IndianRupee, color: 'text-green-600' },
    { label: 'Active Subscriptions', value: String(dashboard?.activeSubscriptions || 0), icon: Receipt, color: 'text-blue-600' },
    { label: 'Total Customers', value: String(dashboard?.totalCustomers || 0), icon: Users, color: 'text-violet-600' },
    { label: 'Total Revenue', value: format(dashboard?.totalRevenue || 0), icon: IndianRupee, color: 'text-emerald-600' },
    { label: 'Outstanding', value: format(dashboard?.outstanding || 0), icon: AlertTriangle, color: 'text-amber-600' },
  ];

  const revenueChartData = (revenueByMonth || []).map((r: any) => ({
    month: r.month,
    revenue: r.totalPaise / 100,
  }));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Business intelligence and financial overview</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-muted-foreground truncate">{kpi.label}</span>
              </div>
              <p className="text-lg font-bold truncate">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue by Month</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                    <RTooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  <FileText className="w-8 h-8 mr-2 opacity-50" />
                  No revenue data yet
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subscriptions by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {subsByStatus && subsByStatus.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={subsByStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {subsByStatus.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 w-full lg:w-auto">
                    {subsByStatus.map((s: any, i: number) => (
                      <div key={s.status} className="flex items-center gap-3 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground">{s.status}</span>
                        <span className="font-medium ml-auto">{s.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoices by Status</CardTitle>
            </CardHeader>
            <CardContent>
              {invoicesByStatus && invoicesByStatus.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {invoicesByStatus.map((s: any, i: number) => (
                    <Card key={s.status} className="border-border/50">
                      <CardContent className="p-4 text-center">
                        <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <p className="text-2xl font-bold">{s.count}</p>
                        <Badge variant="outline" className="mt-1">{s.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {planDist && planDist.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={planDist} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                    <RTooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">No data</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
