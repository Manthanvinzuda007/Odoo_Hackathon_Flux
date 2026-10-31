import { useState } from 'react';
import DataPage from '@/components/data/DataPage';
import { Badge } from '@/components/ui/badge';
import { useFormatCurrency, formatDate, statusColor } from '@/lib/format';

export default function QuotationsPage() {
  const { format } = useFormatCurrency();

  const columns = [
    { key: 'quotationNumber', label: 'Quote #', render: (row: any) => <span className="font-mono text-xs font-medium">{row.quotationNumber}</span> },
    { key: 'customer', label: 'Customer', render: (row: any) => row.customer?.contactName || '—' },
    { key: 'totalPaise', label: 'Total', render: (row: any) => <span className="font-medium">{format(row.totalPaise || 0)}</span> },
    { key: 'status', label: 'Status', render: (row: any) => <Badge variant={statusColor(row.status)}>{row.status}</Badge> },
    { key: 'expiresAt', label: 'Expires', render: (row: any) => row.expiresAt ? formatDate(row.expiresAt) : '—' },
    { key: 'createdAt', label: 'Created', render: (row: any) => formatDate(row.createdAt) },
  ];

  return (
    <DataPage
      title="Quotations"
      description="Manage quotes and proposals"
      endpoint="quotations"
      columns={columns}
      queryKey="quotations"
      addLabel="New Quotation"
    />
  );
}
