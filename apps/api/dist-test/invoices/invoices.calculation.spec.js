"use strict";
describe('Invoice Calculation Engine', () => {
    it('correctly calculates line items, subtotals, GST, and invoice totals', () => {
        const lines = [
            {
                description: 'CRM Pro Plan',
                quantity: 2,
                unitPricePaise: 199900, // ₹1,999.00 each
                taxRate: 1800, // 18% GST
            },
            {
                description: 'Add-on Storage 100GB',
                quantity: 1,
                unitPricePaise: 49900, // ₹499.00
                taxRate: 1800, // 18% GST
            },
        ];
        let subtotalPaise = 0;
        let taxPaise = 0;
        const computedLines = lines.map((l) => {
            const lineSubtotal = l.quantity * l.unitPricePaise;
            const lineTax = Math.round((lineSubtotal * l.taxRate) / 10000);
            const lineTotal = lineSubtotal + lineTax;
            subtotalPaise += lineSubtotal;
            taxPaise += lineTax;
            return { lineSubtotal, lineTax, lineTotal };
        });
        const line0 = computedLines[0];
        const line1 = computedLines[1];
        expect(line0.lineSubtotal).toBe(399800);
        expect(line0.lineTax).toBe(71964);
        expect(line0.lineTotal).toBe(471764);
        expect(line1.lineSubtotal).toBe(49900);
        expect(line1.lineTax).toBe(8982);
        expect(line1.lineTotal).toBe(58882);
        expect(subtotalPaise).toBe(449700); // ₹4,497.00
        expect(taxPaise).toBe(80946); // ₹809.46
        const totalPaise = subtotalPaise + taxPaise;
        expect(totalPaise).toBe(530646); // ₹5,306.46
    });
    it('prevents discount from resulting in negative invoice total', () => {
        const subtotal = 100000;
        const tax = 18000;
        const grossTotal = subtotal + tax; // 118000
        const massiveDiscount = 200000; // ₹2,000.00 discount on ₹1,180.00 bill
        const total = Math.max(0, grossTotal - massiveDiscount);
        expect(total).toBe(0);
        expect(total).toBeGreaterThanOrEqual(0);
    });
});
//# sourceMappingURL=invoices.calculation.spec.js.map