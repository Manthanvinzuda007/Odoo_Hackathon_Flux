import { useState, useEffect } from 'react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { api } from '@/lib/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: any;
}

export default function PlanDialog({ open, onOpenChange, editItem }: Props) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    productId: '',
    pricePaise: '',
    billingInterval: 'MONTHLY',
    trialDays: '0',
    features: '',
    isActive: true,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-for-plan'],
    queryFn: () => api.get('/products?pageSize=100'),
    enabled: open,
  });

  const products = productsData?.data || [];

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        description: editItem.description || '',
        productId: editItem.productId || '',
        pricePaise: String(editItem.pricePaise || ''),
        billingInterval: editItem.billingInterval || 'MONTHLY',
        trialDays: String(editItem.trialDays || 0),
        features: Array.isArray(editItem.features) ? editItem.features.join('\n') : '',
        isActive: editItem.isActive ?? true,
      });
    } else {
      setForm({ name: '', description: '', productId: '', pricePaise: '', billingInterval: 'MONTHLY', trialDays: '0', features: '', isActive: true });
    }
  }, [editItem, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        productId: form.productId || undefined,
        pricePaise: parseInt(form.pricePaise, 10),
        billingInterval: form.billingInterval,
        trialDays: parseInt(form.trialDays, 10) || 0,
        features: form.features ? form.features.split('\n').map((f) => f.trim()).filter(Boolean) : [],
        isActive: form.isActive,
      };
      if (editItem) {
        await api.put(`/plans/${editItem.id}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post('/plans', payload);
        toast.success('Plan created');
      }
      qc.invalidateQueries({ queryKey: ['plans'] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Plan' : 'Create Plan'}</DialogTitle>
          <DialogDescription>{editItem ? 'Update plan details.' : 'Add a new subscription plan.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input placeholder="CRM Pro Monthly" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (paise) *</Label>
              <Input type="number" placeholder="199900 = ₹1,999" value={form.pricePaise} onChange={(e) => setForm({ ...form, pricePaise: e.target.value })} required min="0" />
              {form.pricePaise && (
                <p className="text-xs text-muted-foreground">₹{(parseInt(form.pricePaise) / 100).toLocaleString('en-IN')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Billing Interval *</Label>
              <Select value={form.billingInterval} onValueChange={(v) => setForm({ ...form, billingInterval: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="SEMI_ANNUAL">Semi-Annual</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Trial Period (days)</Label>
            <Input type="number" placeholder="0" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} min="0" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Plan description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Features (one per line)</Label>
            <Textarea placeholder="Unlimited users&#10;Email support&#10;API access" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} rows={4} />
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
