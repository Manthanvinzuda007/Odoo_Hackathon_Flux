import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: any;
}

export default function CustomerDialog({ open, onOpenChange, editItem }: Props) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    contactName: '',
    companyName: '',
    email: '',
    phone: '',
    gstin: '',
    billingAddress: '',
    shippingAddress: '',
    notes: '',
    isActive: true,
  });

  useEffect(() => {
    if (editItem) {
      setForm({
        contactName: editItem.contactName || '',
        companyName: editItem.companyName || '',
        email: editItem.email || '',
        phone: editItem.phone || '',
        gstin: editItem.gstin || '',
        billingAddress: editItem.billingAddress || '',
        shippingAddress: editItem.shippingAddress || '',
        notes: editItem.notes || '',
        isActive: editItem.isActive ?? true,
      });
    } else {
      setForm({ contactName: '', companyName: '', email: '', phone: '', gstin: '', billingAddress: '', shippingAddress: '', notes: '', isActive: true });
    }
  }, [editItem, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { ...form };
      // Remove empty optional fields
      Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k]; });
      payload.isActive = form.isActive;

      if (editItem) {
        await api.put(`/customers/${editItem.id}`, payload);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', payload);
        toast.success('Customer created');
      }
      qc.invalidateQueries({ queryKey: ['customers'] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Customer' : 'Create Customer'}</DialogTitle>
          <DialogDescription>{editItem ? 'Update customer details.' : 'Add a new customer to the system.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contact Name *</Label>
              <Input placeholder="Rajesh Kumar" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input placeholder="Acme Corp" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" placeholder="rajesh@acme.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>GSTIN</Label>
            <Input placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} className="font-mono uppercase" maxLength={15} />
          </div>
          <div className="space-y-2">
            <Label>Billing Address</Label>
            <Textarea placeholder="Full billing address" value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Shipping Address</Label>
            <Textarea placeholder="Full shipping address (if different)" value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea placeholder="Internal notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
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
