import { useState } from 'react';
import DataPage from '@/components/data/DataPage';
import { Badge } from '@/components/ui/badge';
import { useFormatCurrency, formatDate } from '@/lib/format';
import PlanDialog from '@/pages/plans/PlanDialog';

export default function PlansPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const { format } = useFormatCurrency();

  const columns = [
    { key: 'name', label: 'Name', render: (row: any) => <span className="font-medium">{row.name}</span> },
    { key: 'product', label: 'Product', render: (row: any) => row.product?.name || '—' },
    { key: 'pricePaise', label: 'Price', render: (row: any) => format(row.pricePaise) },
    { key: 'billingInterval', label: 'Interval', render: (row: any) => <Badge variant="outline">{row.billingInterval}</Badge> },
    { key: 'trialDays', label: 'Trial', render: (row: any) => row.trialDays ? `${row.trialDays}d` : '—' },
    {
      key: 'isActive',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.isActive ? 'success' : 'secondary'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row: any) => (
        <button
          onClick={() => { setEditItem(row); setDialogOpen(true); }}
          className="text-sm text-primary hover:underline"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <>
      <DataPage
        title="Plans"
        description="Manage subscription plans and pricing"
        endpoint="plans"
        columns={columns}
        queryKey="plans"
        onAdd={() => { setEditItem(null); setDialogOpen(true); }}
        addLabel="Add Plan"
      />
      <PlanDialog open={dialogOpen} onOpenChange={setDialogOpen} editItem={editItem} />
    </>
  );
}
