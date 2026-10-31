import { useState } from 'react';
import DataPage from '@/components/data/DataPage';
import { Badge } from '@/components/ui/badge';
import { useFormatCurrency, formatDate } from '@/lib/format';
import DiscountDialog from '@/pages/discounts/DiscountDialog';

export default function DiscountsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const { format } = useFormatCurrency();

  const columns = [
    { key: 'code', label: 'Code', render: (row: any) => <span className="font-mono font-medium">{row.code}</span> },
    { key: 'name', label: 'Name' },
    {
      key: 'value',
      label: 'Value',
      render: (row: any) =>
        row.type === 'PERCENTAGE' ? `${(row.valueBasisPoints / 100).toFixed(2)}%` : format(row.valuePaise || 0),
    },
    { key: 'type', label: 'Type', render: (row: any) => <Badge variant="outline">{row.type}</Badge> },
    {
      key: 'usage',
      label: 'Usage',
      render: (row: any) => (
        <span className="text-sm">
          {row.redemptionCount || 0}{row.maxRedemptions ? ` / ${row.maxRedemptions}` : ' / ∞'}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.isActive ? 'success' : 'secondary'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    { key: 'validUntil', label: 'Expires', render: (row: any) => row.validUntil ? formatDate(row.validUntil) : '—' },
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
        title="Discounts"
        description="Manage discount codes and promotions"
        endpoint="discounts"
        columns={columns}
        queryKey="discounts"
        onAdd={() => { setEditItem(null); setDialogOpen(true); }}
        addLabel="Add Discount"
      />
      <DiscountDialog open={dialogOpen} onOpenChange={setDialogOpen} editItem={editItem} />
    </>
  );
}
