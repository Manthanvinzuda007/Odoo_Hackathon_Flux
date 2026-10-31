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
import { Plus, Trash2 } from 'lucide-react';

interface Variant {
  name: string;
  sku: string;
  pricePaise: string;
  billingInterval: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: any;
}

export default function ProductDialog({ open, onOpenChange, editItem }: Props) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    sku: '',
    description: '',
    isActive: true,
  });
  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        sku: editItem.sku || '',
        description: editItem.description || '',
        isActive: editItem.isActive ?? true,
      });
      setVariants(
        (editItem.variants || []).map((v: any) => ({
          name: v.name || '',
          sku: v.sku || '',
          pricePaise: String(v.pricePaise || ''),
          billingInterval: v.billingInterval || 'MONTHLY',
        }))
      );
    } else {
      setForm({ name: '', sku: '', description: '', isActive: true });
      setVariants([]);
    }
  }, [editItem, open]);

  function addVariant() {
    setVariants([...variants, { name: '', sku: '', pricePaise: '', billingInterval: 'MONTHLY' }]);
  }

  function removeVariant(index: number) {
    setVariants(variants.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, field: keyof Variant, value: string) {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        variants: variants.map((v) => ({
          name: v.name,
          sku: v.sku,
          pricePaise: parseInt(v.pricePaise, 10),
          billingInterval: v.billingInterval,
        })),
      };
      if (editItem) {
        await api.put(`/products/${editItem.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }
      qc.invalidateQueries({ queryKey: ['products'] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Product' : 'Create Product'}</DialogTitle>
          <DialogDescription>{editItem ? 'Update product details.' : 'Add a new product with optional variants.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input placeholder="CRM Suite" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input placeholder="CRM-001" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required className="font-mono uppercase" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Product description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.isActive} onCheckedChange={(v: boolean) => setForm({ ...form, isActive: v })} />
            <Label>Active</Label>
          </div>

          {/* Variants */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Variants</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant
              </Button>
            </div>
            {variants.map((v, i) => (
              <div key={i} className="p-3 border rounded-lg space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Variant {i + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(i)} className="h-7 w-7 p-0 text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Variant name" value={v.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} required />
                  <Input placeholder="SKU" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} required className="font-mono uppercase" />
                  <Input type="number" placeholder="Price (paise)" value={v.pricePaise} onChange={(e) => updateVariant(i, 'pricePaise', e.target.value)} required min="0" />
                  <select
                    value={v.billingInterval}
                    onChange={(e) => updateVariant(i, 'billingInterval', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="SEMI_ANNUAL">Semi-Annual</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
              </div>
            ))}
            {variants.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No variants yet. Click "Add Variant" to add one.</p>
            )}
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
