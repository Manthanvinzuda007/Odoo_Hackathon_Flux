import { useState } from 'react';
import DataPage from '@/components/data/DataPage';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import ProductDialog from '@/pages/products/ProductDialog';

export default function ProductsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const columns = [
    { key: 'sku', label: 'SKU', render: (row: any) => <span className="font-mono text-xs">{row.sku}</span> },
    { key: 'name', label: 'Name', render: (row: any) => <span className="font-medium">{row.name}</span> },
    { key: 'variants', label: 'Variants', render: (row: any) => row._count?.variants ?? row.variants?.length ?? 0 },
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
        title="Products"
        description="Manage your product catalog"
        endpoint="products"
        columns={columns}
        queryKey="products"
        onAdd={() => { setEditItem(null); setDialogOpen(true); }}
        addLabel="Add Product"
      />
      <ProductDialog open={dialogOpen} onOpenChange={setDialogOpen} editItem={editItem} />
    </>
  );
}
