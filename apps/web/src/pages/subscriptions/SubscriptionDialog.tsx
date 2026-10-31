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
import { Plus, Trash2 } from 'lucide-react';

interface SubLine {
  planId: string;
  quantity: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SubscriptionDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [billingInterval, setBillingInterval] = useState('MONTHLY');
  const [startDate, setStartDate] = useState('');
  const [lines, setLines] = useState<SubLine[]>([{ planId: '', quantity: '1' }]);

  const { data: customersData } = useQuery({
    queryKey: ['customers-for-sub'],
    queryFn: () => api.get('/customers?pageSize=100'),
    enabled: open,
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans-for-sub'],
    queryFn: () => api.get('/plans?pageSize=100'),
    enabled: open,
  });

  const customers = customersData?.data || [];
  const plans = plansData?.data || [];

  useEffect(() => {
    if (open) {
      setCustomerId('');
      setBillingInterval('MONTHLY');
      setStartDate(new Date().toISOString().slice(0, 10));
      setLines([{ planId: '', quantity: '1' }]);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId) { toast.error('Select a customer'); return; }
    if (lines.some((l) => !l.planId)) { toast.error('Select a plan for each line'); return; }
    setLoading(true);
    try {
      await api.post('/subscriptions', {
        customerId,
        billingInterval,
        startDate: new Date(startDate).toISOString(),
        lines: lines.map((l) => ({
          planId: l.planId,
          quantity: parseInt(l.quantity, 10) || 1,
        })),
      });
      toast.success('Subscription created');
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create Subscription</DialogTitle>
          <DialogDescription>Create a new subscription for a customer.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Customer *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.contactName}{c.companyName ? ` (${c.companyName})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Billing Interval</Label>
              <Select value={billingInterval} onValueChange={setBillingInterval}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="SEMI_ANNUAL">Semi-Annual</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
          </div>

          {/* Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Plan Lines</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setLines([...lines, { planId: '', quantity: '1' }])}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Line
              </Button>
            </div>
            {lines.map((line, i) => (
              <div key={i} className="flex items-end gap-3 p-3 border rounded-lg bg-muted/30">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Plan</Label>
                  <Select value={line.planId} onValueChange={(v) => { const u = [...lines]; u[i].planId = v; setLines(u); }}>
                    <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
                    <SelectContent>
                      {plans.filter((p: any) => p.isActive).map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} — ₹{(p.pricePaise / 100).toLocaleString('en-IN')}/{p.billingInterval}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20 space-y-1">
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" min="1" value={line.quantity} onChange={(e) => { const u = [...lines]; u[i].quantity = e.target.value; setLines(u); }} />
                </div>
                {lines.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setLines(lines.filter((_, j) => j !== i))} className="h-10 w-10 p-0 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner size="sm" className="mr-2" />}
              Create Subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
