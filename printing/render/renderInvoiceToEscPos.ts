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

// ESC/POS command bytes
const ESC = 0x1b;
const GS = 0x1d;

// Comandos ESC/POS comunes para optimización
const CMD = {
  INIT: Buffer.from([ESC, 0x40]), // Inicializar impresora
  BOLD_ON: Buffer.from([ESC, 0x45, 0x01]), // Negrita ON
  BOLD_OFF: Buffer.from([ESC, 0x45, 0x00]), // Negrita OFF
  ALIGN_CENTER: Buffer.from([ESC, 0x61, 0x01]), // Centrar
  ALIGN_LEFT: Buffer.from([ESC, 0x61, 0x00]), // Izquierda
  FEED_3: Buffer.from([ESC, 0x64, 0x03]), // 3 líneas
  CUT: Buffer.from([GS, 0x56, 0x00]), // Cortar papel (si soporta)
  LF: Buffer.from([0x0A]), // Line feed
};

export function renderInvoiceToEscPos(invoiceData: InvoiceData, options: EscPosRenderOptions = {}): Buffer {
  const width = options.paperWidthChars ?? 48;
  
  // Construir el documento usando Buffers directamente (más eficiente)
  const parts: Buffer[] = [];
  
  // Inicializar
  parts.push(CMD.INIT);
  
  // Encabezado (centrado y negrita)
  parts.push(CMD.ALIGN_CENTER, CMD.BOLD_ON);
  parts.push(Buffer.from(truncate(invoiceData.business.name, width) + '\n', 'utf8'));
  parts.push(CMD.BOLD_OFF);
  
  for (const l of invoiceData.business.addressLines ?? []) {
    parts.push(Buffer.from(truncate(l, width) + '\n', 'utf8'));
  }
  if (invoiceData.business.phone) {
    parts.push(Buffer.from(`Tel: ${truncate(invoiceData.business.phone, width - 5)}\n`, 'utf8'));
  }
  
  parts.push(CMD.ALIGN_LEFT);
  parts.push(Buffer.from('-'.repeat(width) + '\n', 'ascii'));

  // Info de factura
  const dateStr = formatDateTime(invoiceData.issuedAtISO);
  parts.push(Buffer.from(twoCols(`Factura: ${invoiceData.invoiceNumber}`, dateStr, width) + '\n', 'utf8'));
  
  if (invoiceData.customer?.name) {
    parts.push(Buffer.from(`Cliente: ${truncate(invoiceData.customer.name, width - 9)}\n`, 'utf8'));
  }
  if (invoiceData.customer?.id) {
    parts.push(Buffer.from(`ID: ${truncate(invoiceData.customer.id, width - 4)}\n`, 'utf8'));
  }
  
  parts.push(Buffer.from('-'.repeat(width) + '\n', 'ascii'));

  // Items (limitar a 20 para evitar facturas muy largas en impresoras lentas)
  const maxItems = 20;
  const items = invoiceData.items.slice(0, maxItems);
  
  for (const it of items) {
    const subtotal = formatMoney(it.qty * it.unitPriceCents, invoiceData.currency);
    const itemName = truncate(it.name, width - subtotal.length - 5);
    parts.push(Buffer.from(twoCols(`${it.qty}x ${itemName}`, subtotal, width) + '\n', 'utf8'));
  }
  
  if (invoiceData.items.length > maxItems) {
    parts.push(Buffer.from(`... +${invoiceData.items.length - maxItems} artículos más\n`, 'utf8'));
  }

  parts.push(Buffer.from('-'.repeat(width) + '\n', 'ascii'));
  
  // Totales
  parts.push(Buffer.from(twoCols('Subtotal', formatMoney(invoiceData.totals.subtotalCents, invoiceData.currency), width) + '\n', 'utf8'));
  
  if (invoiceData.totals.taxCents) {
    parts.push(Buffer.from(twoCols('Impuesto', formatMoney(invoiceData.totals.taxCents, invoiceData.currency), width) + '\n', 'utf8'));
  }
  
  if (invoiceData.totals.discountCents) {
    parts.push(Buffer.from(twoCols('Descuento', formatMoney(-Math.abs(invoiceData.totals.discountCents), invoiceData.currency), width) + '\n', 'utf8'));
  }
  
  // Total en negrita
  parts.push(CMD.BOLD_ON);
  parts.push(Buffer.from(twoCols('TOTAL', formatMoney(invoiceData.totals.totalCents, invoiceData.currency), width) + '\n', 'utf8'));
  parts.push(CMD.BOLD_OFF);

  // Notas
  if (invoiceData.notes) {
    parts.push(CMD.LF);
    parts.push(Buffer.from(truncate(invoiceData.notes, width * 3) + '\n', 'utf8'));
  }

  // Despedida centrada
  parts.push(CMD.LF, CMD.ALIGN_CENTER);
  parts.push(Buffer.from('Gracias por su compra.\n', 'utf8'));
  parts.push(CMD.ALIGN_LEFT);

  // Feed y cortar
  parts.push(CMD.FEED_3);
  parts.push(CMD.CUT);

  // Concatenar todo de una vez (más eficiente que muchas operaciones)
  return Buffer.concat(parts);
}
