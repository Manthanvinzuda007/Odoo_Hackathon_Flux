import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useFormatCurrency, formatDate, statusColor } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';

export default function PortalInvoices() {
  const { format } = useFormatCurrency();

  const { data, isLoading } = useQuery({
    queryKey: ['portal', 'my-invoices'],
    queryFn: () => api.get('/invoices?pageSize=50'),
  });

  const invoices = data?.data || [];

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Invoices</h1>
        <p className="text-sm text-muted-foreground mt-1">View your billing history and outstanding invoices</p>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No invoices found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3 px-3 font-medium text-muted-foreground">Invoice #</th>
                <th className="py-3 px-3 font-medium text-muted-foreground">Date</th>
                <th className="py-3 px-3 font-medium text-muted-foreground">Total</th>
                <th className="py-3 px-3 font-medium text-muted-foreground">Due</th>
                <th className="py-3 px-3 font-medium text-muted-foreground">Status</th>
                <th className="py-3 px-3 font-medium text-muted-foreground">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="py-3 px-3">{formatDate(inv.createdAt)}</td>
                  <td className="py-3 px-3 font-medium">{format(inv.totalPaise)}</td>
                  <td className="py-3 px-3">
                    <span className={inv.amountDuePaise > 0 ? 'text-amber-600 font-medium' : ''}>
                      {format(inv.amountDuePaise)}
                    </span>
                  </td>
                  <td className="py-3 px-3"><Badge variant={statusColor(inv.status)}>{inv.status}</Badge></td>
                  <td className="py-3 px-3">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
