import type { InvoiceData } from './types';

export interface BluetoothDeviceInfo {
  id: string; // usually MAC address
  name?: string;
  address: string;
  bonded?: boolean;
}

export interface PrinterDriver {
  listDevices(): Promise<BluetoothDeviceInfo[]>;
  connect(deviceId: string): Promise<void>;
  printInvoice(invoiceData: InvoiceData): Promise<void>;
  disconnect(): Promise<void>;
}
