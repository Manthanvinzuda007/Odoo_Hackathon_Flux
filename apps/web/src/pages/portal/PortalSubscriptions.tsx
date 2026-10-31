import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useFormatCurrency, formatDate, statusColor } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard } from 'lucide-react';

export default function PortalSubscriptions() {
  const { format } = useFormatCurrency();

  const { data, isLoading } = useQuery({
    queryKey: ['portal', 'my-subscriptions'],
    queryFn: () => api.get('/subscriptions?pageSize=50'),
  });

  const subscriptions = data?.data || [];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage your active subscriptions</p>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No subscriptions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub: any) => (
            <Card key={sub.id} className="border-border/50">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{sub.lines?.[0]?.plan?.name || 'Subscription'}</h3>
                      <Badge variant={statusColor(sub.status)}>{sub.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {sub.billingInterval} billing · MRR: {format(sub.mrrPaise || 0)}
                    </p>
                  </div>
                  <div className="text-sm space-y-1 sm:text-right">
                    <p><span className="text-muted-foreground">Started:</span> {sub.startDate ? formatDate(sub.startDate) : '—'}</p>
                    <p><span className="text-muted-foreground">Next billing:</span> {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : '—'}</p>
                  </div>
                </div>

                {/* Line items */}
                {sub.lines && sub.lines.length > 0 && (
                  <div className="mt-4 border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Plan Details</p>
                    {sub.lines.map((line: any) => (
                      <div key={line.id} className="flex items-center justify-between py-1 text-sm">
                        <span>{line.plan?.name || 'Plan'} × {line.quantity}</span>
                        <span className="font-medium">{format(line.unitPricePaise * line.quantity)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
