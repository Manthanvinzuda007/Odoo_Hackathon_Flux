import { formatINR } from '@brightloop/shared';

export function useFormatCurrency() {
  return {
    format: (paise: number) => formatINR(paise),
    formatShort: (paise: number) => {
      const rupees = paise / 100;
      if (rupees >= 10000000) return `₹${(rupees / 10000000).toFixed(1)}Cr`;
      if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
      if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}K`;
      return formatINR(paise);
    },
  };
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function statusColor(status: string): 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
    ACTIVE: 'success', PAID: 'success', COMPLETED: 'success', ACCEPTED: 'success',
    DRAFT: 'secondary', PENDING: 'secondary', QUOTATION: 'secondary', CONFIRMED: 'secondary',
    PAUSED: 'warning', PARTIALLY_PAID: 'warning', SENT: 'warning', ISSUED: 'warning',
    OVERDUE: 'destructive', CANCELLED: 'destructive', FAILED: 'destructive', REJECTED: 'destructive', VOID: 'destructive', CLOSED: 'outline',
    EXPIRED: 'outline',
  };
  return map[status] || 'default';
}
