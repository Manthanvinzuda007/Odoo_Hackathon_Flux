import { SubscriptionStatus, QuotationStatus, InvoiceStatus } from './enums';

const VALID_SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  [SubscriptionStatus.DRAFT]: [SubscriptionStatus.QUOTATION, SubscriptionStatus.CONFIRMED, SubscriptionStatus.CANCELLED],
  [SubscriptionStatus.QUOTATION]: [SubscriptionStatus.CONFIRMED, SubscriptionStatus.CANCELLED],
  [SubscriptionStatus.CONFIRMED]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
  [SubscriptionStatus.ACTIVE]: [SubscriptionStatus.PAUSED, SubscriptionStatus.CANCELLED, SubscriptionStatus.CLOSED],
  [SubscriptionStatus.PAUSED]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED, SubscriptionStatus.CLOSED],
  [SubscriptionStatus.CANCELLED]: [],
  [SubscriptionStatus.CLOSED]: [],
};

export function isValidSubscriptionTransition(
  from: SubscriptionStatus,
  to: SubscriptionStatus,
): boolean {
  return VALID_SUBSCRIPTION_TRANSITIONS[from]?.includes(to) ?? false;
}

const VALID_QUOTATION_TRANSITIONS: Record<QuotationStatus, QuotationStatus[]> = {
  [QuotationStatus.DRAFT]: [QuotationStatus.SENT, QuotationStatus.CANCELLED],
  [QuotationStatus.SENT]: [QuotationStatus.ACCEPTED, QuotationStatus.REJECTED, QuotationStatus.EXPIRED, QuotationStatus.CANCELLED],
  [QuotationStatus.ACCEPTED]: [],
  [QuotationStatus.REJECTED]: [QuotationStatus.DRAFT],
  [QuotationStatus.EXPIRED]: [QuotationStatus.DRAFT],
  [QuotationStatus.CANCELLED]: [],
};

export function isValidQuotationTransition(
  from: QuotationStatus,
  to: QuotationStatus,
): boolean {
  return VALID_QUOTATION_TRANSITIONS[from]?.includes(to) ?? false;
}

const VALID_INVOICE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [InvoiceStatus.ISSUED, InvoiceStatus.VOID],
  [InvoiceStatus.ISSUED]: [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.VOID],
  [InvoiceStatus.PARTIALLY_PAID]: [InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.VOID],
  [InvoiceStatus.PAID]: [InvoiceStatus.VOID],
  [InvoiceStatus.OVERDUE]: [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.VOID],
  [InvoiceStatus.VOID]: [],
};

export function isValidInvoiceTransition(
  from: InvoiceStatus,
  to: InvoiceStatus,
): boolean {
  return VALID_INVOICE_TRANSITIONS[from]?.includes(to) ?? false;
}
