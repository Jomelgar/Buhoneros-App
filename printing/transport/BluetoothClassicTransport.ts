import { Platform } from 'react-native';
import { Buffer } from 'buffer';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { PrinterError } from '../errors';

type DeviceWriteEncoding =
  | 'binary'
  | 'utf-8'
  | 'ascii'
  | 'utf8'
  | 'utf16le'
  | 'ucs2'
  | 'ucs-2'
  | 'base64'
  | 'latin1'
  | 'hex'
  | undefined;

export class BluetoothClassicTransport {
  async ensureAvailableAndEnabled(): Promise<void> {
    if (Platform.OS !== 'android') {
      throw new PrinterError('UNSUPPORTED_PLATFORM', 'Bluetooth Classic transport is only enabled for Android in this project.');
    }

    const available = await RNBluetoothClassic.isBluetoothAvailable();
    if (!available) {
      throw new PrinterError('BLUETOOTH_UNAVAILABLE', 'Este dispositivo no soporta Bluetooth.');
    }

    const enabled = await RNBluetoothClassic.isBluetoothEnabled();
    if (!enabled) {
      const requested = await RNBluetoothClassic.requestBluetoothEnabled();
      if (!requested) {
        throw new PrinterError('BLUETOOTH_DISABLED', 'Bluetooth está apagado. Enciéndelo para imprimir.');
      }
    }
  }

  async listBondedDevices(): Promise<BluetoothDevice[]> {
    await this.ensureAvailableAndEnabled();
    return RNBluetoothClassic.getBondedDevices();
  }

  async discoverUnpairedDevices(): Promise<BluetoothDevice[]> {
    await this.ensureAvailableAndEnabled();
    return RNBluetoothClassic.startDiscovery();
  }

  async connect(address: string): Promise<BluetoothDevice> {
    await this.ensureAvailableAndEnabled();
    const devices = await RNBluetoothClassic.getBondedDevices();
    const device = devices.find((d: BluetoothDevice) => d.address === address) ?? null;

    if (!device) {
      throw new PrinterError('DEVICE_NOT_FOUND', `No se encontró el dispositivo ${address}. Asegúrate de emparejar la impresora.`);
    }

    const alreadyConnected = await device.isConnected();
    if (!alreadyConnected) {
      const connected = await device.connect({
        connectorType: 'rfcomm',
        connectionType: 'binary',
      });
      if (!connected) {
        throw new PrinterError('CONNECTION_FAILED', 'No se pudo conectar con la impresora.');
      }
    }

    return device;
  }

  async disconnect(device: BluetoothDevice | null): Promise<void> {
    if (!device) return;
    try {
      await device.disconnect();
    } catch {
      // ignore
    }
  }

  async write(device: BluetoothDevice | null, data: string | Buffer, encoding?: DeviceWriteEncoding): Promise<void> {
    if (!device) {
      throw new PrinterError('NOT_CONNECTED', 'No hay una impresora conectada.');
    }

    try {
      // If data is string, you can specify encoding. If Buffer, encoding is ignored.
      await device.write(data as any, encoding);
    } catch (error) {
      throw new PrinterError('WRITE_FAILED', 'Error enviando datos a la impresora.', error);
    }
  }
}
