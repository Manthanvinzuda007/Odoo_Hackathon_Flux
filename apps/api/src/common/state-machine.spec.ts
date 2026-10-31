import {
  SubscriptionStatus,
  QuotationStatus,
  InvoiceStatus,
  isValidSubscriptionTransition,
  isValidQuotationTransition,
  isValidInvoiceTransition,
} from '@brightloop/shared';

describe('State Machine & Transition Rules', () => {
  describe('Subscription Lifecycle', () => {
    it('allows valid lifecycle transitions from DRAFT to ACTIVE', () => {
      expect(isValidSubscriptionTransition(SubscriptionStatus.DRAFT, SubscriptionStatus.QUOTATION)).toBe(true);
      expect(isValidSubscriptionTransition(SubscriptionStatus.DRAFT, SubscriptionStatus.CONFIRMED)).toBe(true);
      expect(isValidSubscriptionTransition(SubscriptionStatus.CONFIRMED, SubscriptionStatus.ACTIVE)).toBe(true);
    });

    it('allows pausing and resuming active subscriptions', () => {
      expect(isValidSubscriptionTransition(SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED)).toBe(true);
      expect(isValidSubscriptionTransition(SubscriptionStatus.PAUSED, SubscriptionStatus.ACTIVE)).toBe(true);
    });

    it('disallows invalid backwards or arbitrary transitions', () => {
      expect(isValidSubscriptionTransition(SubscriptionStatus.CANCELLED, SubscriptionStatus.ACTIVE)).toBe(false);
      expect(isValidSubscriptionTransition(SubscriptionStatus.CLOSED, SubscriptionStatus.ACTIVE)).toBe(false);
      expect(isValidSubscriptionTransition(SubscriptionStatus.ACTIVE, SubscriptionStatus.DRAFT)).toBe(false);
    });
  });

  describe('Quotation Lifecycle', () => {
    it('allows valid quotation progression', () => {
      expect(isValidQuotationTransition(QuotationStatus.DRAFT, QuotationStatus.SENT)).toBe(true);
      expect(isValidQuotationTransition(QuotationStatus.SENT, QuotationStatus.ACCEPTED)).toBe(true);
      expect(isValidQuotationTransition(QuotationStatus.SENT, QuotationStatus.REJECTED)).toBe(true);
    });

    it('prevents modification once accepted', () => {
      expect(isValidQuotationTransition(QuotationStatus.ACCEPTED, QuotationStatus.DRAFT)).toBe(false);
      expect(isValidQuotationTransition(QuotationStatus.ACCEPTED, QuotationStatus.CANCELLED)).toBe(false);
    });
  });

  describe('Invoice Lifecycle', () => {
    it('allows valid invoice payment progression', () => {
      expect(isValidInvoiceTransition(InvoiceStatus.DRAFT, InvoiceStatus.ISSUED)).toBe(true);
      expect(isValidInvoiceTransition(InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID)).toBe(true);
      expect(isValidInvoiceTransition(InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID)).toBe(true);
    });

    it('allows voiding an issued invoice', () => {
      expect(isValidInvoiceTransition(InvoiceStatus.ISSUED, InvoiceStatus.VOID)).toBe(true);
    });

    it('prevents transitioning from VOID', () => {
      expect(isValidInvoiceTransition(InvoiceStatus.VOID, InvoiceStatus.ISSUED)).toBe(false);
      expect(isValidInvoiceTransition(InvoiceStatus.VOID, InvoiceStatus.PAID)).toBe(false);
    });
  });
});
