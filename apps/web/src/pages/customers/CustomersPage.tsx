import { useState } from 'react';
import DataPage from '@/components/data/DataPage';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import CustomerDialog from '@/pages/customers/CustomerDialog';

export default function CustomersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const columns = [
    { key: 'customerNumber', label: 'ID', render: (row: any) => <span className="font-mono text-xs">{row.customerNumber}</span> },
    { key: 'contactName', label: 'Contact', render: (row: any) => <span className="font-medium">{row.contactName}</span> },
    { key: 'companyName', label: 'Company', render: (row: any) => row.companyName || '—' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (row: any) => row.phone || '—' },
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
        title="Customers"
        description="Manage your customer database"
        endpoint="customers"
        columns={columns}
        queryKey="customers"
        onAdd={() => { setEditItem(null); setDialogOpen(true); }}
        addLabel="Add Customer"
      />
      <CustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} editItem={editItem} />
    </>
  );
}
