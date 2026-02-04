import type { InvoiceData } from '../types';
import { PrinterError } from '../errors';
import { truncate } from '../utils/text';
import { ZEBRA_ZPL_TEMPLATE } from './zebraTemplates';

export interface ZplRenderOptions {
  printWidthDots?: number; // 4" @203dpi ≈ 812
  maxItemNameChars?: number;
}

function assertTemplatePresent(template: string): void {
  if (!template || template.trim().length === 0) {
    throw new PrinterError(
      'TEMPLATE_MISSING',
      'Falta la plantilla ZPL en printing/render/zebraTemplates.ts (ZEBRA_ZPL_TEMPLATE).'
    );
  }
}

function escapeZplText(value: string): string {
  // Minimal escape: ZPL is mostly ASCII; avoid ^ and ~ which are control chars.
  return (value ?? '').replace(/[\^~]/g, ' ');
}

function formatDecimalFromCents(cents: number): string {
  const v = (cents ?? 0) / 100;
  return v.toFixed(2);
}

function formatDateYYYYMMDD(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function renderItemsZpl(invoice: InvoiceData, maxItemNameChars: number): string {
  // Match your provided template positions
  const xDesc = 30;
  const xQty = 540;
  const xPrice = 610;
  const xSub = 710;
  const startY = 250;
  const rowHeight = 35;
  const maxRows = 3; // template has room for 3 rows before y=360

  const parts: string[] = [];
  const items = invoice.items ?? [];

  const rows = items.slice(0, maxRows);
  for (let i = 0; i < rows.length; i++) {
    const item = rows[i];
    const y = startY + i * rowHeight;
    const name = escapeZplText(truncate(item.name ?? '', maxItemNameChars));
    const qty = escapeZplText(String(item.qty ?? ''));
    const price = escapeZplText(formatDecimalFromCents(item.unitPriceCents ?? 0));
    const subtotal = escapeZplText(formatDecimalFromCents((item.qty ?? 0) * (item.unitPriceCents ?? 0)));

    parts.push(`^FO${xDesc},${y}^A0N,28,28^FD${name}^FS`);
    parts.push(`^FO${xQty},${y}^A0N,28,28^FD${qty}^FS`);
    parts.push(`^FO${xPrice},${y}^A0N,28,28^FD${price}^FS`);
    parts.push(`^FO${xSub},${y}^A0N,28,28^FD${subtotal}^FS`);
  }

  if (items.length > maxRows) {
    const y = startY + (maxRows - 1) * rowHeight;
    const remaining = items.length - (maxRows - 1);
    const msg = escapeZplText(truncate(`+${remaining} más...`, maxItemNameChars));
    // Override last row description to indicate overflow; keep columns blank
    parts.splice(parts.length - 4, 4);
    parts.push(`^FO${xDesc},${y}^A0N,28,28^FD${msg}^FS`);
    parts.push(`^FO${xQty},${y}^A0N,28,28^FD^FS`);
    parts.push(`^FO${xPrice},${y}^A0N,28,28^FD^FS`);
    parts.push(`^FO${xSub},${y}^A0N,28,28^FD^FS`);
  }

  return parts.join('\n');
}

export function renderInvoiceToZpl(invoiceData: InvoiceData, options: ZplRenderOptions = {}): string {
  assertTemplatePresent(ZEBRA_ZPL_TEMPLATE);

  const opts: Required<ZplRenderOptions> = {
    printWidthDots: options.printWidthDots ?? 812,
    maxItemNameChars: options.maxItemNameChars ?? 28,
  };

  const replacements: Record<string, string> = {
    TITLE: escapeZplText('Factura'),
    INVOICE_NUMBER: escapeZplText(invoiceData.invoiceNumber),
    DATE_YYYY_MM_DD: escapeZplText(formatDateYYYYMMDD(invoiceData.issuedAtISO)),
    BUSINESS_NAME: escapeZplText(invoiceData.business.name),
    CUSTOMER_NAME: escapeZplText(invoiceData.customer?.name ?? ''),
    SUBTOTAL: escapeZplText(formatDecimalFromCents(invoiceData.totals.subtotalCents)),
    TAX: escapeZplText(formatDecimalFromCents(invoiceData.totals.taxCents ?? 0)),
    TOTAL: escapeZplText(formatDecimalFromCents(invoiceData.totals.totalCents)),
    NOTES: escapeZplText(truncate(invoiceData.notes ?? 'Gracias por su compra.', 40)),
    ITEMS_ZPL: renderItemsZpl(invoiceData, opts.maxItemNameChars),
  };

  return ZEBRA_ZPL_TEMPLATE.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key: string) => {
    if (Object.prototype.hasOwnProperty.call(replacements, key)) return replacements[key];
    // Leave unknown placeholders intact for easier debugging
    return `{{${key}}}`;
  });
}
