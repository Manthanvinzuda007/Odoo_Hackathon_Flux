import { useState } from 'react';
import DataPage from '@/components/data/DataPage';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import TaxDialog from '@/pages/taxes/TaxDialog';

export default function TaxesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const columns = [
    { key: 'name', label: 'Name', render: (row: any) => <span className="font-medium">{row.name}</span> },
    { key: 'rate', label: 'Rate (%)', render: (row: any) => `${(row.rateBasisPoints / 100).toFixed(2)}%` },
    { key: 'type', label: 'Type', render: (row: any) => <Badge variant="outline">{row.type}</Badge> },
    {
      key: 'isActive',
      label: 'Status',
      render: (row: any) => (
        <Badge variant={row.isActive ? 'success' : 'secondary'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    { key: 'createdAt', label: 'Created', render: (row: any) => formatDate(row.createdAt) },
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
        title="Taxes"
        description="Manage tax rates for billing and invoices"
        endpoint="taxes"
        columns={columns}
        queryKey="taxes"
        onAdd={() => { setEditItem(null); setDialogOpen(true); }}
        addLabel="Add Tax"
      />
      <TaxDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editItem={editItem}
      />
    </>
  );
}
