export type CurrencyCode = 'HNL' | 'USD' | 'EUR' | string;

export type MoneyCents = number;

export interface BusinessInfo {
  name: string;
  addressLines?: string[];
  phone?: string;
  taxId?: string;
}

export interface CustomerInfo {
  name: string;
  id?: string;
  addressLines?: string[];
  phone?: string;
}

export interface InvoiceItem {
  sku?: string;
  name: string;
  qty: number;
  unitPriceCents: MoneyCents;
}

export interface InvoiceTotals {
  subtotalCents: MoneyCents;
  taxCents?: MoneyCents;
  discountCents?: MoneyCents;
  totalCents: MoneyCents;
}

export interface InvoiceData {
  invoiceNumber: string;
  issuedAtISO: string;
  currency: CurrencyCode;

  business: BusinessInfo;
  customer?: CustomerInfo;

  items: InvoiceItem[];
  totals: InvoiceTotals;

  notes?: string;

  /** Optional codes if your template supports it */
  qrValue?: string;
  barcodeValue?: string;
}
