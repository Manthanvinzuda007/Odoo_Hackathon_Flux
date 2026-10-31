import {
  toPaise,
  toRupees,
  formatINR,
  calculatePercentage,
  addAmounts,
  subtractAmount,
} from '@brightloop/shared';

describe('Financial Money Utilities', () => {
  it('converts rupees to paise safely without floating-point error', () => {
    expect(toPaise(100)).toBe(10000);
    expect(toPaise(1250.5)).toBe(125050);
    expect(toPaise(99.99)).toBe(9999);
  });

  it('converts paise to rupees', () => {
    expect(toRupees(10000)).toBe(100);
    expect(toRupees(125050)).toBe(1250.5);
  });

  it('formats currency in Indian numbering system', () => {
    // en-IN format produces ₹1,25,000.00
    const formatted = formatINR(12500000);
    expect(formatted).toContain('1,25,000.00');
    expect(formatINR(0)).toContain('0.00');
  });

  it('calculates percentage accurately using integer paise', () => {
    const subtotal = 100000; // ₹1,000.00
    // 18% GST
    const gst = calculatePercentage(subtotal, 18);
    expect(gst).toBe(18000); // ₹180.00
  });

  it('adds and subtracts monetary amounts without precision loss', () => {
    expect(addAmounts(10000, 25050, 18000)).toBe(53050);
    expect(subtractAmount(100000, 20000)).toBe(80000);
  });
});
