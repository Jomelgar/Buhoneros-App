import type { InvoiceData } from '../types';
/**
 * SECCIÓN DE IMPRESIONES - Driver Zebra (ZPL/CPCL)
 * NO MODIFICAR SIN REVISAR - VERIFICADO Y FUNCIONAL
 */

import { BaseBluetoothClassicDriver } from './BaseBluetoothClassicDriver';
import { renderInvoiceToZpl } from '../render/renderInvoiceToZpl';
import { renderInvoiceToCpcl } from '../render/renderInvoiceToCpcl';

export type ZebraLanguage = 'zpl' | 'cpcl';

export interface ZebraDriverOptions {
  language?: ZebraLanguage; // default: zpl
  printWidthDots?: number; // default 812
}

export class ZebraDriver extends BaseBluetoothClassicDriver {
  constructor(private readonly options: ZebraDriverOptions = {}) {
    super();
  }

  async printInvoice(invoiceData: InvoiceData): Promise<void> {
    const language = this.options.language ?? 'zpl';

    if (language === 'cpcl') {
      const cpcl = renderInvoiceToCpcl(invoiceData);
      await this.transport.write(this.device, cpcl, 'ascii');
      return;
    }

    const zpl = renderInvoiceToZpl(invoiceData, {
      printWidthDots: this.options.printWidthDots ?? 812,
    });

    await this.transport.write(this.device, zpl, 'ascii');
  }
}
