import { describe, it, expect } from 'vitest';
import { useFormatCurrency, formatDate, statusColor } from './format';

describe('Frontend Format Utilities', () => {
  const { format, formatShort } = useFormatCurrency();

  it('formats paise amounts accurately into INR', () => {
    const formatted = format(199900);
    expect(formatted).toContain('1,999.00');
  });

  it('formats short currency abbreviations in thousands, lakhs, and crores', () => {
    // 50,000 rupees = 5,000,000 paise -> 50K
    expect(formatShort(5000000)).toBe('₹50.0K');
    // 5 lakh rupees = 50,000,000 paise -> 5L
    expect(formatShort(50000000)).toBe('₹5.0L');
    // 2 crore rupees = 200,000,000 paise -> 2Cr
    expect(formatShort(2000000000)).toBe('₹2.0Cr');
  });

  it('formats ISO dates correctly into Indian localized format', () => {
    const formatted = formatDate('2026-10-31T10:00:00.000Z');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Oct');
  });

  it('maps entity statuses to appropriate UI badge color variants', () => {
    expect(statusColor('ACTIVE')).toBe('success');
    expect(statusColor('PAID')).toBe('success');
    expect(statusColor('DRAFT')).toBe('secondary');
    expect(statusColor('PENDING')).toBe('secondary');
    expect(statusColor('PAUSED')).toBe('warning');
    expect(statusColor('PARTIALLY_PAID')).toBe('warning');
    expect(statusColor('OVERDUE')).toBe('destructive');
    expect(statusColor('CANCELLED')).toBe('destructive');
    expect(statusColor('CLOSED')).toBe('outline');
  });
});
