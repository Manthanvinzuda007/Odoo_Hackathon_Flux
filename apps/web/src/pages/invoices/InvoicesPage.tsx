import { useState } from 'react';
import DataPage from '@/components/data/DataPage';
import { Badge } from '@/components/ui/badge';
import { useFormatCurrency, formatDate, statusColor } from '@/lib/format';

export default function InvoicesPage() {
  const { format } = useFormatCurrency();

  const columns = [
    { key: 'invoiceNumber', label: 'Invoice #', render: (row: any) => <span className="font-mono text-xs font-medium">{row.invoiceNumber}</span> },
    { key: 'customer', label: 'Customer', render: (row: any) => row.customer?.contactName || '—' },
    { key: 'totalPaise', label: 'Total', render: (row: any) => <span className="font-medium">{format(row.totalPaise)}</span> },
    { key: 'amountDuePaise', label: 'Due', render: (row: any) => (
      <span className={row.amountDuePaise > 0 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>{format(row.amountDuePaise)}</span>
    )},
    { key: 'status', label: 'Status', render: (row: any) => <Badge variant={statusColor(row.status)}>{row.status}</Badge> },
    { key: 'dueDate', label: 'Due Date', render: (row: any) => row.dueDate ? formatDate(row.dueDate) : '—' },
    { key: 'issuedAt', label: 'Issued', render: (row: any) => row.issuedAt ? formatDate(row.issuedAt) : '—' },
  ];

  return (
    <DataPage
      title="Invoices"
      description="View and manage invoices"
      endpoint="invoices"
      columns={columns}
      queryKey="invoices"
    />
  );
}
