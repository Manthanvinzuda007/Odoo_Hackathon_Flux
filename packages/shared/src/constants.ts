export const APP_NAME = 'Brightloop';

export const DEFAULT_LOCALE = 'en-IN';
export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_CURRENCY_SYMBOL = '₹';
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export const BILLING_CRON_HOUR = 2; // 02:00 Asia/Kolkata
export const BILLING_CRON_MINUTE = 0;

export const OVERDUE_REMINDER_DAYS = [1, 7, 14] as const;

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const SEQUENCE_PREFIXES = {
  INVOICE: 'INV',
  QUOTATION: 'QUO',
  PAYMENT: 'PAY',
  CUSTOMER: 'CUS',
} as const;
