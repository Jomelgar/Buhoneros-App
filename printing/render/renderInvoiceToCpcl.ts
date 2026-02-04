import type { InvoiceData } from '../types';
import { PrinterError } from '../errors';
import { ZEBRA_CPCL_TEMPLATE } from './zebraTemplates';

function assertTemplatePresent(template: string): void {
  if (!template || template.includes('PASTE_YOUR_CPCL_TEMPLATE_HERE')) {
    throw new PrinterError(
      'TEMPLATE_MISSING',
      'Falta la plantilla CPCL. Pega tu bloque en printing/render/zebraTemplates.ts (ZEBRA_CPCL_TEMPLATE).'
    );
  }
}

export function renderInvoiceToCpcl(invoiceData: InvoiceData): string {
  assertTemplatePresent(ZEBRA_CPCL_TEMPLATE);

  // CPCL placeholders are handled the same way as ZPL here.
  const replacements: Record<string, string> = {
    INVOICE_NUMBER: invoiceData.invoiceNumber,
    ISSUED_AT: invoiceData.issuedAtISO,
  };

  return ZEBRA_CPCL_TEMPLATE.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key: string) => {
    if (Object.prototype.hasOwnProperty.call(replacements, key)) return replacements[key];
    return `{{${key}}}`;
  });
}
