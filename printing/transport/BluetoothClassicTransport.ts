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

    console.log('[BT] Verificando disponibilidad de Bluetooth...');
    const available = await RNBluetoothClassic.isBluetoothAvailable();
    console.log(`[BT] Bluetooth disponible: ${available}`);
    
    if (!available) {
      throw new PrinterError('BLUETOOTH_UNAVAILABLE', 'Este dispositivo no soporta Bluetooth.');
    }

    console.log('[BT] Verificando si Bluetooth está habilitado...');
    const enabled = await RNBluetoothClassic.isBluetoothEnabled();
    console.log(`[BT] Bluetooth habilitado: ${enabled}`);
    
    if (!enabled) {
      console.log('[BT] Solicitando habilitar Bluetooth...');
      const requested = await RNBluetoothClassic.requestBluetoothEnabled();
      console.log(`[BT] Usuario aceptó habilitar: ${requested}`);
      
      if (!requested) {
        throw new PrinterError('BLUETOOTH_DISABLED', 'Bluetooth está apagado. Enciéndelo para imprimir.');
      }
    }
    
    console.log('[BT] Bluetooth listo para usar');
  }

  async listBondedDevices(): Promise<BluetoothDevice[]> {
    await this.ensureAvailableAndEnabled();
    
    console.log('[BT] Obteniendo dispositivos emparejados...');
    
    // Timeout de 5 segundos para evitar cuelgues
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout al buscar dispositivos')), 5000);
    });
    
    try {
      const devices = await Promise.race([
        RNBluetoothClassic.getBondedDevices(),
        timeoutPromise
      ]);
      
      console.log(`[BT] Encontrados ${devices.length} dispositivos emparejados:`);
      devices.forEach(d => console.log(`  - ${d.name || 'Sin nombre'} (${d.address})`));
      
      return devices;
    } catch (error) {
      console.error('[BT] Error obteniendo dispositivos:', error);
      throw new PrinterError('BLUETOOTH_ERROR', 'Error al obtener dispositivos Bluetooth: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async discoverUnpairedDevices(): Promise<BluetoothDevice[]> {
    await this.ensureAvailableAndEnabled();
    
    console.log('[BT] Iniciando discovery de dispositivos cercanos...');
    
    // Discovery con timeout de 8 segundos
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.warn('[BT] Discovery timeout (8s), cancelando...');
        RNBluetoothClassic.cancelDiscovery().catch(() => {/* ignore */});
        reject(new Error('Discovery timeout'));
      }, 8000);
    });
    
    try {
      const devices = await Promise.race([
        RNBluetoothClassic.startDiscovery(),
        timeoutPromise
      ]);
      
      console.log(`[BT] Discovery completado: ${devices.length} dispositivos encontrados`);
      devices.forEach(d => console.log(`  - ${d.name || 'Sin nombre'} (${d.address})`));
      
      return devices;
    } catch (error) {
      console.error('[BT] Discovery falló:', error);
      // Intentar cancelar por si acaso
      try {
        await RNBluetoothClassic.cancelDiscovery();
      } catch {}
      throw error;
    }
  }

  async connect(address: string): Promise<BluetoothDevice> {
    await this.ensureAvailableAndEnabled();
    const devices = await RNBluetoothClassic.getBondedDevices();
    const device = devices.find((d: BluetoothDevice) => d.address === address) ?? null;

    if (!device) {
      throw new PrinterError('DEVICE_NOT_FOUND', `No se encontró el dispositivo ${address}. Asegúrate de emparejar la impresora primero en Configuración > Bluetooth.`);
    }

    // Verificar si ya está conectado primero (evita delay)
    const alreadyConnected = await device.isConnected();
    if (alreadyConnected) {
      return device;
    }

    // Intentar conectar con timeout
    try {
      const connected = await device.connect({
        connectorType: 'rfcomm',
        connectionType: 'binary',
        DELIMITER: '',
      });
      if (!connected) {
        throw new PrinterError('CONNECTION_FAILED', 'No se pudo conectar con la impresora. Verifica que esté encendida y cerca.');
      }
    } catch (err) {
      throw new PrinterError('CONNECTION_FAILED', 'Error al conectar: ' + (err instanceof Error ? err.message : String(err)));
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

    // Verificar conexión antes de escribir
    const isConnected = await device.isConnected();
    if (!isConnected) {
      throw new PrinterError('NOT_CONNECTED', 'La impresora se desconectó. Reconecta antes de imprimir.');
    }

    try {
      // Para buffers grandes, enviar en chunks para evitar timeout
      const CHUNK_SIZE = 512; // bytes
      
      if (data instanceof Buffer && data.length > CHUNK_SIZE) {
        // Enviar en chunks para mejor rendimiento con impresoras lentas
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, Math.min(i + CHUNK_SIZE, data.length));
          await device.write(chunk as any);
          // Pequeño delay para evitar overflow del buffer de la impresora
          if (i + CHUNK_SIZE < data.length) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
      } else {
        // Datos pequeños o string, enviar directo
        await device.write(data as any, encoding);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new PrinterError('WRITE_FAILED', `Error enviando datos: ${msg}. Verifica que la impresora esté encendida y con papel.`, error);
    }
  }
}
