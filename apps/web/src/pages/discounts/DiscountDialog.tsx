import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: any;
}

export default function DiscountDialog({ open, onOpenChange, editItem }: Props) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'PERCENTAGE',
    valueBasisPoints: '',
    valuePaise: '',
    maxRedemptions: '',
    maxPerCustomer: '',
    minimumAmountPaise: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
  });

  useEffect(() => {
    if (editItem) {
      setForm({
        code: editItem.code || '',
        name: editItem.name || '',
        type: editItem.type || 'PERCENTAGE',
        valueBasisPoints: String(editItem.valueBasisPoints || ''),
        valuePaise: String(editItem.valuePaise || ''),
        maxRedemptions: editItem.maxRedemptions ? String(editItem.maxRedemptions) : '',
        maxPerCustomer: editItem.maxPerCustomer ? String(editItem.maxPerCustomer) : '',
        minimumAmountPaise: editItem.minimumAmountPaise ? String(editItem.minimumAmountPaise) : '',
        validFrom: editItem.validFrom ? editItem.validFrom.slice(0, 10) : '',
        validUntil: editItem.validUntil ? editItem.validUntil.slice(0, 10) : '',
        isActive: editItem.isActive ?? true,
      });
    } else {
      setForm({ code: '', name: '', type: 'PERCENTAGE', valueBasisPoints: '', valuePaise: '', maxRedemptions: '', maxPerCustomer: '', minimumAmountPaise: '', validFrom: '', validUntil: '', isActive: true });
    }
  }, [editItem, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = {
        code: form.code.toUpperCase(),
        name: form.name,
        type: form.type,
        isActive: form.isActive,
      };
      if (form.type === 'PERCENTAGE') {
        payload.valueBasisPoints = parseInt(form.valueBasisPoints, 10);
      } else {
        payload.valuePaise = parseInt(form.valuePaise, 10);
      }
      if (form.maxRedemptions) payload.maxRedemptions = parseInt(form.maxRedemptions, 10);
      if (form.maxPerCustomer) payload.maxPerCustomer = parseInt(form.maxPerCustomer, 10);
      if (form.minimumAmountPaise) payload.minimumAmountPaise = parseInt(form.minimumAmountPaise, 10);
      if (form.validFrom) payload.validFrom = new Date(form.validFrom).toISOString();
      if (form.validUntil) payload.validUntil = new Date(form.validUntil).toISOString();

      if (editItem) {
        await api.put(`/discounts/${editItem.id}`, payload);
        toast.success('Discount updated');
      } else {
        await api.post('/discounts', payload);
        toast.success('Discount created');
      }
      qc.invalidateQueries({ queryKey: ['discounts'] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save discount');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Discount' : 'Create Discount'}</DialogTitle>
          <DialogDescription>{editItem ? 'Update discount details.' : 'Add a new discount code.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input placeholder="EARLY20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required className="font-mono uppercase" />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Early Bird 20%" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === 'PERCENTAGE' ? (
              <div className="space-y-2">
                <Label>Value (basis points)</Label>
                <Input type="number" placeholder="2000 = 20%" value={form.valueBasisPoints} onChange={(e) => setForm({ ...form, valueBasisPoints: e.target.value })} required min="1" max="10000" />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Amount (paise)</Label>
                <Input type="number" placeholder="100000 = ₹1,000" value={form.valuePaise} onChange={(e) => setForm({ ...form, valuePaise: e.target.value })} required min="1" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Redemptions (total)</Label>
              <Input type="number" placeholder="Unlimited" value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })} min="1" />
            </div>
            <div className="space-y-2">
              <Label>Max Per Customer</Label>
              <Input type="number" placeholder="Unlimited" value={form.maxPerCustomer} onChange={(e) => setForm({ ...form, maxPerCustomer: e.target.value })} min="1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valid From</Label>
              <Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Valid Until</Label>
              <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Minimum Purchase (paise)</Label>
            <Input type="number" placeholder="Optional" value={form.minimumAmountPaise} onChange={(e) => setForm({ ...form, minimumAmountPaise: e.target.value })} min="0" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.isActive} onCheckedChange={(v: boolean) => setForm({ ...form, isActive: v })} />
            <Label>Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner size="sm" className="mr-2" />}
              {editItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
