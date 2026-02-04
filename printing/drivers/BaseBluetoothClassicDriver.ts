import type { BluetoothDevice } from 'react-native-bluetooth-classic';
import type { BluetoothDeviceInfo, PrinterDriver } from '../PrinterDriver';
import type { InvoiceData } from '../types';
import { ensureAndroidBluetoothPermissions } from '../permissions/androidBluetoothPermissions';
import { BluetoothClassicTransport } from '../transport/BluetoothClassicTransport';

export abstract class BaseBluetoothClassicDriver implements PrinterDriver {
  protected readonly transport = new BluetoothClassicTransport();
  protected device: BluetoothDevice | null = null;

  /**
   * Lista TODOS los dispositivos Bluetooth disponibles:
   * - Emparejados (bonded)
   * - Cercanos sin emparejar (discovered via scan)
   */
  async listDevices(): Promise<BluetoothDeviceInfo[]> {
    console.log('[Driver] Iniciando búsqueda de dispositivos...');
    
    // Timeout global de 15 segundos para toda la operación
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error('[Driver] TIMEOUT: Búsqueda superó 15 segundos');
        reject(new Error('La búsqueda de impresoras tardó demasiado. Verifica que Bluetooth esté encendido y los permisos otorgados.'));
      }, 15000);
    });
    
    const searchPromise = (async () => {
      try {
        // Solicitar permisos primero (con su propio timeout interno)
        console.log('[Driver] Solicitando permisos Bluetooth...');
        await ensureAndroidBluetoothPermissions();
        console.log('[Driver] ✅ Permisos Bluetooth OK');

        // Obtener dispositivos emparejados
        console.log('[Driver] Obteniendo dispositivos emparejados...');
        const bonded = await this.transport.listBondedDevices();
        console.log(`[Driver] ✅ Encontrados ${bonded.length} dispositivos emparejados`);

        const map = new Map<string, BluetoothDeviceInfo>();
        
        // Agregar emparejados al mapa
        bonded.forEach((d) => {
          map.set(d.address, {
            id: d.address,
            address: d.address,
            name: d.name || d.address,
            bonded: true,
          });
          console.log(`[Driver]   📱 ${d.name || 'Sin nombre'} (${d.address}) - EMPAREJADO`);
        });

        // Intentar discovery de dispositivos cercanos (timeout 8 segundos)
        console.log('[Driver] Buscando dispositivos cercanos (discovery)...');
        try {
          const discovered = await this.transport.discoverUnpairedDevices();
          console.log(`[Driver] ✅ Discovery encontró ${discovered.length} dispositivos`);
          
          discovered.forEach((d) => {
            if (!map.has(d.address)) {
              map.set(d.address, {
                id: d.address,
                address: d.address,
                name: d.name || d.address,
                bonded: false,
              });
              console.log(`[Driver]   🔍 ${d.name || 'Sin nombre'} (${d.address}) - CERCANO`);
            }
          });
        } catch (discoveryError) {
          console.warn('[Driver] ⚠️ Discovery falló o se canceló:', discoveryError);
          // No es crítico, continuamos con los emparejados
        }

        const allDevices = Array.from(map.values());
        const sorted = allDevices.sort((a, b) => {
          // Emparejados primero
          if (a.bonded && !b.bonded) return -1;
          if (!a.bonded && b.bonded) return 1;
          return (a.name || a.address).localeCompare(b.name || b.address);
        });
        
        console.log(`[Driver] ✅ Búsqueda completada: ${sorted.length} dispositivos totales`);
        return sorted;
      } catch (error) {
        console.error('[Driver] ❌ Error en búsqueda:', error);
        throw error;
      }
    })();
    
    // Race entre búsqueda y timeout
    return Promise.race([searchPromise, timeoutPromise]);
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
