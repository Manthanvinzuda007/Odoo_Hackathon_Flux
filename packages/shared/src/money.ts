/**
 * Money utilities using integer minor units (paise for INR).
 * All amounts stored/transmitted as integers representing paise.
 * 1 INR = 100 paise
 */

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  return paise / 100;
}

export function formatINR(paise: number): string {
  const rupees = toRupees(paise);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function calculatePercentage(amountPaise: number, percentage: number): number {
  return Math.round((amountPaise * percentage) / 100);
}

export function addAmounts(...amounts: number[]): number {
  return amounts.reduce((sum, amt) => sum + amt, 0);
}

export function subtractAmount(from: number, amount: number): number {
  return from - amount;
}
