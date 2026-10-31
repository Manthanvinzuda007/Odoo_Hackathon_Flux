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

export default function TaxDialog({ open, onOpenChange, editItem }: Props) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    rateBasisPoints: '',
    type: 'PERCENTAGE',
    isActive: true,
  });

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        rateBasisPoints: String(editItem.rateBasisPoints || ''),
        type: editItem.type || 'PERCENTAGE',
        isActive: editItem.isActive ?? true,
      });
    } else {
      setForm({ name: '', rateBasisPoints: '', type: 'PERCENTAGE', isActive: true });
    }
  }, [editItem, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        rateBasisPoints: parseInt(form.rateBasisPoints, 10),
        type: form.type,
        isActive: form.isActive,
      };
      if (editItem) {
        await api.put(`/taxes/${editItem.id}`, payload);
        toast.success('Tax updated');
      } else {
        await api.post('/taxes', payload);
        toast.success('Tax created');
      }
      qc.invalidateQueries({ queryKey: ['taxes'] });
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save tax');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Tax' : 'Create Tax'}</DialogTitle>
          <DialogDescription>
            {editItem ? 'Update tax rate details.' : 'Add a new tax rate to the system.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tax-name">Name</Label>
            <Input id="tax-name" placeholder="e.g. GST 18%" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax-rate">Rate (basis points, 1800 = 18%)</Label>
            <Input id="tax-rate" type="number" placeholder="1800" value={form.rateBasisPoints} onChange={(e) => setForm({ ...form, rateBasisPoints: e.target.value })} required min="0" max="10000" />
            <p className="text-xs text-muted-foreground">
              {form.rateBasisPoints ? `${(parseInt(form.rateBasisPoints) / 100).toFixed(2)}%` : '0%'}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                <SelectItem value="FIXED">Fixed</SelectItem>
              </SelectContent>
            </Select>
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
