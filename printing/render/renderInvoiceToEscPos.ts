import type { InvoiceData } from '../types';
import { Buffer } from 'buffer';
import { formatDateTime, formatMoney } from '../utils/format';
import { truncate } from '../utils/text';

export interface EscPosRenderOptions {
  paperWidthChars?: number; // common: 42 (58mm) / 48 (80mm)
}

function line(text = ''): string {
  return `${text}\n`;
}

function padRight(text: string, width: number): string {
  if (text.length >= width) return text;
  return text + ' '.repeat(width - text.length);
}

function padLeft(text: string, width: number): string {
  if (text.length >= width) return text;
  return ' '.repeat(width - text.length) + text;
}

function twoCols(left: string, right: string, width: number): string {
  const rightTrim = right.trim();
  const space = 1;
  const leftWidth = Math.max(0, width - rightTrim.length - space);
  return `${padRight(truncate(left, leftWidth), leftWidth)} ${rightTrim}`;
}

// Minimal ESC/POS bytes for init + feed
const ESC = 0x1b;
const GS = 0x1d;

export function renderInvoiceToEscPos(invoiceData: InvoiceData, options: EscPosRenderOptions = {}): Buffer {
  const width = options.paperWidthChars ?? 48;
  const out: string[] = [];

  out.push(line(invoiceData.business.name));
  for (const l of invoiceData.business.addressLines ?? []) out.push(line(l));
  if (invoiceData.business.phone) out.push(line(`Tel: ${invoiceData.business.phone}`));
  out.push(line('-'.repeat(width)));

  out.push(line(twoCols(`Factura: ${invoiceData.invoiceNumber}`, formatDateTime(invoiceData.issuedAtISO), width)));
  if (invoiceData.customer?.name) out.push(line(`Cliente: ${invoiceData.customer.name}`));
  if (invoiceData.customer?.id) out.push(line(`ID: ${invoiceData.customer.id}`));
  out.push(line('-'.repeat(width)));

  for (const it of invoiceData.items) {
    const subtotal = formatMoney(it.qty * it.unitPriceCents, invoiceData.currency);
    out.push(line(twoCols(`${it.qty}x ${it.name}`, subtotal, width)));
  }

  out.push(line('-'.repeat(width)));
  out.push(line(twoCols('Subtotal', formatMoney(invoiceData.totals.subtotalCents, invoiceData.currency), width)));
  if (invoiceData.totals.taxCents) out.push(line(twoCols('Impuesto', formatMoney(invoiceData.totals.taxCents, invoiceData.currency), width)));
  if (invoiceData.totals.discountCents) out.push(line(twoCols('Descuento', formatMoney(-Math.abs(invoiceData.totals.discountCents), invoiceData.currency), width)));
  out.push(line(twoCols('TOTAL', formatMoney(invoiceData.totals.totalCents, invoiceData.currency), width)));

  if (invoiceData.notes) {
    out.push(line(''));
    out.push(line(invoiceData.notes));
  }

  out.push(line(''));
  out.push(line('Gracias por su compra.'));

  const text = out.join('');

  // ESC/POS commands: Initialize, text, feed, cut (if supported)
  const init = Buffer.from([ESC, 0x40]);
  const payload = Buffer.from(text, 'ascii');
  const feed = Buffer.from([ESC, 0x64, 0x05]);
  const cut = Buffer.from([GS, 0x56, 0x00]);

  return Buffer.concat([init, payload, feed, cut]);
}
