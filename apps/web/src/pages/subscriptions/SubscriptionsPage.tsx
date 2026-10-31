import { useState } from 'react';
import DataPage from '@/components/data/DataPage';
import { Badge } from '@/components/ui/badge';
import { useFormatCurrency, formatDate, statusColor } from '@/lib/format';
import SubscriptionDialog from '@/pages/subscriptions/SubscriptionDialog';

export default function SubscriptionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { format } = useFormatCurrency();

  const columns = [
    {
      key: 'subscriptionNumber',
      label: 'ID',
      render: (row: any) => <span className="font-mono text-xs">{row.subscriptionNumber || row.id?.slice(0, 8)}</span>,
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (row: any) => row.customer?.contactName || '—',
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (row: any) => row.lines?.[0]?.plan?.name || '—',
    },
    { key: 'billingInterval', label: 'Interval', render: (row: any) => <Badge variant="outline">{row.billingInterval}</Badge> },
    { key: 'mrrPaise', label: 'MRR', render: (row: any) => format(row.mrrPaise || 0) },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => <Badge variant={statusColor(row.status)}>{row.status}</Badge>,
    },
    { key: 'nextBillingDate', label: 'Next Billing', render: (row: any) => row.nextBillingDate ? formatDate(row.nextBillingDate) : '—' },
  ];

  return (
    <>
      <DataPage
        title="Subscriptions"
        description="Manage customer subscriptions and lifecycle"
        endpoint="subscriptions"
        columns={columns}
        queryKey="subscriptions"
        onAdd={() => setDialogOpen(true)}
        addLabel="New Subscription"
      />
      <SubscriptionDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
