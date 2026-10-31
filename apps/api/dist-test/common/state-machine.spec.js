"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@brightloop/shared");
describe('State Machine & Transition Rules', () => {
    describe('Subscription Lifecycle', () => {
        it('allows valid lifecycle transitions from DRAFT to ACTIVE', () => {
            expect((0, shared_1.isValidSubscriptionTransition)(shared_1.SubscriptionStatus.DRAFT, shared_1.SubscriptionStatus.QUOTATION)).toBe(true);
            expect((0, shared_1.isValidSubscriptionTransition)(shared_1.SubscriptionStatus.DRAFT, shared_1.SubscriptionStatus.CONFIRMED)).toBe(true);
            expect((0, shared_1.isValidSubscriptionTransition)(shared_1.SubscriptionStatus.CONFIRMED, shared_1.SubscriptionStatus.ACTIVE)).toBe(true);
        });
        it('allows pausing and resuming active subscriptions', () => {
            expect((0, shared_1.isValidSubscriptionTransition)(shared_1.SubscriptionStatus.ACTIVE, shared_1.SubscriptionStatus.PAUSED)).toBe(true);
            expect((0, shared_1.isValidSubscriptionTransition)(shared_1.SubscriptionStatus.PAUSED, shared_1.SubscriptionStatus.ACTIVE)).toBe(true);
        });
        it('disallows invalid backwards or arbitrary transitions', () => {
            expect((0, shared_1.isValidSubscriptionTransition)(shared_1.SubscriptionStatus.CANCELLED, shared_1.SubscriptionStatus.ACTIVE)).toBe(false);
            expect((0, shared_1.isValidSubscriptionTransition)(shared_1.SubscriptionStatus.CLOSED, shared_1.SubscriptionStatus.ACTIVE)).toBe(false);
            expect((0, shared_1.isValidSubscriptionTransition)(shared_1.SubscriptionStatus.ACTIVE, shared_1.SubscriptionStatus.DRAFT)).toBe(false);
        });
    });
    describe('Quotation Lifecycle', () => {
        it('allows valid quotation progression', () => {
            expect((0, shared_1.isValidQuotationTransition)(shared_1.QuotationStatus.DRAFT, shared_1.QuotationStatus.SENT)).toBe(true);
            expect((0, shared_1.isValidQuotationTransition)(shared_1.QuotationStatus.SENT, shared_1.QuotationStatus.ACCEPTED)).toBe(true);
            expect((0, shared_1.isValidQuotationTransition)(shared_1.QuotationStatus.SENT, shared_1.QuotationStatus.REJECTED)).toBe(true);
        });
        it('prevents modification once accepted', () => {
            expect((0, shared_1.isValidQuotationTransition)(shared_1.QuotationStatus.ACCEPTED, shared_1.QuotationStatus.DRAFT)).toBe(false);
            expect((0, shared_1.isValidQuotationTransition)(shared_1.QuotationStatus.ACCEPTED, shared_1.QuotationStatus.CANCELLED)).toBe(false);
        });
    });
    describe('Invoice Lifecycle', () => {
        it('allows valid invoice payment progression', () => {
            expect((0, shared_1.isValidInvoiceTransition)(shared_1.InvoiceStatus.DRAFT, shared_1.InvoiceStatus.ISSUED)).toBe(true);
            expect((0, shared_1.isValidInvoiceTransition)(shared_1.InvoiceStatus.ISSUED, shared_1.InvoiceStatus.PARTIALLY_PAID)).toBe(true);
            expect((0, shared_1.isValidInvoiceTransition)(shared_1.InvoiceStatus.PARTIALLY_PAID, shared_1.InvoiceStatus.PAID)).toBe(true);
        });
        it('allows voiding an issued invoice', () => {
            expect((0, shared_1.isValidInvoiceTransition)(shared_1.InvoiceStatus.ISSUED, shared_1.InvoiceStatus.VOID)).toBe(true);
        });
        it('prevents transitioning from VOID', () => {
            expect((0, shared_1.isValidInvoiceTransition)(shared_1.InvoiceStatus.VOID, shared_1.InvoiceStatus.ISSUED)).toBe(false);
            expect((0, shared_1.isValidInvoiceTransition)(shared_1.InvoiceStatus.VOID, shared_1.InvoiceStatus.PAID)).toBe(false);
        });
    });
});
//# sourceMappingURL=state-machine.spec.js.map