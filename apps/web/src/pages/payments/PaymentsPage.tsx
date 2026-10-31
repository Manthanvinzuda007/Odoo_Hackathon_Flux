import { useState } from 'react';
import DataPage from '@/components/data/DataPage';
import { Badge } from '@/components/ui/badge';
import { useFormatCurrency, formatDate, statusColor } from '@/lib/format';
import PaymentDialog from '@/pages/payments/PaymentDialog';

export default function PaymentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { format } = useFormatCurrency();

  const columns = [
    { key: 'paymentNumber', label: 'Payment #', render: (row: any) => <span className="font-mono text-xs">{row.paymentNumber}</span> },
    { key: 'customer', label: 'Customer', render: (row: any) => row.invoice?.customer?.contactName || row.customer?.contactName || '—' },
    { key: 'invoice', label: 'Invoice', render: (row: any) => <span className="font-mono text-xs">{row.invoice?.invoiceNumber || '—'}</span> },
    { key: 'amountPaise', label: 'Amount', render: (row: any) => <span className="font-medium">{format(row.amountPaise)}</span> },
    { key: 'method', label: 'Method', render: (row: any) => <Badge variant="outline">{row.method}</Badge> },
    { key: 'status', label: 'Status', render: (row: any) => <Badge variant={statusColor(row.status)}>{row.status}</Badge> },
    { key: 'paidAt', label: 'Date', render: (row: any) => formatDate(row.paidAt) },
  ];

  return (
    <>
      <DataPage
        title="Payments"
        description="Track and record payment transactions"
        endpoint="payments"
        columns={columns}
        queryKey="payments"
        onAdd={() => setDialogOpen(true)}
        addLabel="Record Payment"
      />
      <PaymentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
