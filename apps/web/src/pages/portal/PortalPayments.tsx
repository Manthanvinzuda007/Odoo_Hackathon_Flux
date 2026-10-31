import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useFormatCurrency, formatDate, statusColor } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Receipt } from 'lucide-react';

export default function PortalPayments() {
  const { format } = useFormatCurrency();

  const { data, isLoading } = useQuery({
    queryKey: ['portal', 'my-payments'],
    queryFn: () => api.get('/payments?pageSize=50'),
  });

  const payments = data?.data || [];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Payments</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View your completed transaction and payment history
        </p>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No payments found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3 px-3 font-medium text-muted-foreground">Payment #</th>
                <th className="py-3 px-3 font-medium text-muted-foreground">Invoice #</th>
                <th className="py-3 px-3 font-medium text-muted-foreground">Amount</th>
                <th className="py-3 px-3 font-medium text-muted-foreground">Method</th>
                <th className="py-3 px-3 font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-3 font-medium text-muted-foreground">Date Paid</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pmt: any) => (
                <tr key={pmt.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-xs">{pmt.paymentNumber}</td>
                  <td className="py-3 px-3 font-mono text-xs">
                    {pmt.invoice?.invoiceNumber || '—'}
                  </td>
                  <td className="py-3 px-3 font-medium">{format(pmt.amountPaise)}</td>
                  <td className="py-3 px-3">
                    <Badge variant="outline">{pmt.method}</Badge>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant={statusColor(pmt.status)}>{pmt.status}</Badge>
                  </td>
                  <td className="py-3 px-3">{formatDate(pmt.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
