import type { InvoiceData } from '../types';
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
