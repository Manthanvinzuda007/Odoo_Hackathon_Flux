import { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';
import { useFormatCurrency } from '@/lib/format';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PaymentDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { format } = useFormatCurrency();
  const [loading, setLoading] = useState(false);
  const [invoiceId, setInvoiceId] = useState('');
  const [amountPaise, setAmountPaise] = useState('');
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [reference, setReference] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices-for-payment'],
    queryFn: () => api.get('/invoices?pageSize=100&status=ISSUED,PARTIALLY_PAID,OVERDUE'),
    enabled: open,
  });

  const invoices = invoicesData?.data || [];

  const selectedInvoice = invoices.find((inv: any) => inv.id === invoiceId);

  useEffect(() => {
    if (open) {
      setInvoiceId('');
      setAmountPaise('');
      setMethod('BANK_TRANSFER');
      setReference('');
      setPaidAt(new Date().toISOString().slice(0, 10));
    }
  }, [open]);

  useEffect(() => {
    if (selectedInvoice) {
      setAmountPaise(String(selectedInvoice.amountDuePaise || 0));
    }
  }, [selectedInvoice]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceId) { toast.error('Select an invoice'); return; }
    setLoading(true);
    try {
      await api.post('/payments', {
        invoiceId,
        amountPaise: parseInt(amountPaise, 10),
        method,
        reference: reference || undefined,
        paidAt: new Date(paidAt).toISOString(),
      });
      toast.success('Payment recorded');
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>Record a payment against an outstanding invoice.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Invoice *</Label>
            <Select value={invoiceId} onValueChange={setInvoiceId}>
              <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
              <SelectContent>
                {invoices.map((inv: any) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {format(inv.amountDuePaise)} due ({inv.customer?.contactName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedInvoice && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Total</span>
                <span className="font-medium">{format(selectedInvoice.totalPaise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Due</span>
                <span className="font-medium text-amber-600">{format(selectedInvoice.amountDuePaise)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount (paise) *</Label>
              <Input type="number" placeholder="Amount in paise" value={amountPaise} onChange={(e) => setAmountPaise(e.target.value)} required min="1" />
              {amountPaise && (
                <p className="text-xs text-muted-foreground">₹{(parseInt(amountPaise) / 100).toLocaleString('en-IN')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input placeholder="Transaction ID" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date Paid</Label>
              <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner size="sm" className="mr-2" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
