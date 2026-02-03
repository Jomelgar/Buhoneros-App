import type { CurrencyCode, MoneyCents } from '../types';

export function formatMoney(cents: MoneyCents, currency: CurrencyCode): string {
  const amount = (cents ?? 0) / 100;
  try {
    // RN Hermes supports Intl on modern versions; if missing, we fallback.
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'HNL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    const sign = amount < 0 ? '-' : '';
    const abs = Math.abs(amount);
    return `${sign}${currency} ${abs.toFixed(2)}`;
  }
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}
