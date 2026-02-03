import type { BluetoothDevice } from 'react-native-bluetooth-classic';
import type { BluetoothDeviceInfo, PrinterDriver } from '../PrinterDriver';
import type { InvoiceData } from '../types';
import { ensureAndroidBluetoothPermissions } from '../permissions/androidBluetoothPermissions';
import { BluetoothClassicTransport } from '../transport/BluetoothClassicTransport';

export abstract class BaseBluetoothClassicDriver implements PrinterDriver {
  protected readonly transport = new BluetoothClassicTransport();
  protected device: BluetoothDevice | null = null;

  async listDevices(): Promise<BluetoothDeviceInfo[]> {
    await ensureAndroidBluetoothPermissions();

    const bonded = await this.transport.listBondedDevices();

    // Discovery is optional; if it fails (permission/user), we still return bonded.
    let discovered: BluetoothDevice[] = [];
    try {
      discovered = await this.transport.discoverUnpairedDevices();
    } catch {
      discovered = [];
    }

    const map = new Map<string, BluetoothDeviceInfo>();
    for (const d of bonded) {
      map.set(d.address, {
        id: d.address,
        address: d.address,
        name: d.name,
        bonded: true,
      });
    }
    for (const d of discovered) {
      if (!map.has(d.address)) {
        map.set(d.address, {
          id: d.address,
          address: d.address,
          name: d.name,
          bonded: false,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => (a.name || a.address).localeCompare(b.name || b.address));
  }

  async connect(deviceId: string): Promise<void> {
    await ensureAndroidBluetoothPermissions();
    this.device = await this.transport.connect(deviceId);
  }

  abstract printInvoice(invoiceData: InvoiceData): Promise<void>;

  async disconnect(): Promise<void> {
    await this.transport.disconnect(this.device);
    this.device = null;
  }
}
