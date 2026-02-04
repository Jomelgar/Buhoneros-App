import type { InvoiceData } from '../types';
/**
 * SECCIÓN DE IMPRESIONES - Driver ESC/POS (Impresoras genéricas)
 * NO MODIFICAR SIN REVISAR - VERIFICADO Y FUNCIONAL
 * Compatible con impresoras térmicas como PT-210
 */

import { BaseBluetoothClassicDriver } from './BaseBluetoothClassicDriver';
import { renderInvoiceToEscPos } from '../render/renderInvoiceToEscPos';

export interface EscPosDriverOptions {
  paperWidthChars?: number;
}

export class EscPosDriver extends BaseBluetoothClassicDriver {
  constructor(private readonly options: EscPosDriverOptions = {}) {
    super();
  }

  async printInvoice(invoiceData: InvoiceData): Promise<void> {
    const bytes = renderInvoiceToEscPos(invoiceData, {
      paperWidthChars: this.options.paperWidthChars ?? 48,
    });

    await this.transport.write(this.device, bytes);
  }
}
