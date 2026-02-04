import { PermissionsAndroid, Platform } from 'react-native';
import { PrinterError } from '../errors';

export async function ensureAndroidBluetoothPermissions(): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new PrinterError('UNSUPPORTED_PLATFORM', 'Bluetooth printing is only implemented for Android in this project.');
  }

  console.log('[Permisos] Verificando permisos Bluetooth...');
  const api = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;
  console.log(`[Permisos] Android API level: ${api}`);

  // Timeout de 10 segundos para solicitud de permisos
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      console.error('[Permisos] TIMEOUT esperando respuesta del usuario');
      reject(new PrinterError('PERMISSION_TIMEOUT', 'No se recibió respuesta para los permisos Bluetooth. Intenta de nuevo.'));
    }, 10000);
  });

  const requestPermissions = async () => {
    // Android 12+ (API 31+) uses BLUETOOTH_* runtime permissions
    if (api >= 31) {
      console.log('[Permisos] Solicitando BLUETOOTH_SCAN...');
      const scan = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, {
        title: 'Permiso Bluetooth',
        message: 'Necesario para buscar tu impresora.',
        buttonNegative: 'Cancelar',
        buttonPositive: 'Permitir',
      });
      console.log(`[Permisos] BLUETOOTH_SCAN: ${scan}`);
      
      if (scan !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new PrinterError('PERMISSION_DENIED', 'Permiso BLUETOOTH_SCAN denegado. Ábrelo en Configuración > Apps > Buhoneros App > Permisos.');
      }

      console.log('[Permisos] Solicitando BLUETOOTH_CONNECT...');
      const connect = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, {
        title: 'Permiso Bluetooth',
        message: 'Necesario para conectar con tu impresora.',
        buttonNegative: 'Cancelar',
        buttonPositive: 'Permitir',
      });
      console.log(`[Permisos] BLUETOOTH_CONNECT: ${connect}`);
      
      if (connect !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new PrinterError('PERMISSION_DENIED', 'Permiso BLUETOOTH_CONNECT denegado. Ábrelo en Configuración > Apps > Buhoneros App > Permisos.');
      }

      console.log('[Permisos] ✅ Todos los permisos Android 12+ otorgados');
      return;
    }

    // Android 11 and lower: discovery requires location permission
    console.log('[Permisos] Solicitando ACCESS_FINE_LOCATION...');
    const fine = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
      title: 'Permiso de ubicación',
      message: 'Android requiere ubicación para buscar dispositivos Bluetooth.',
      buttonNegative: 'Cancelar',
      buttonPositive: 'Permitir',
    });
    console.log(`[Permisos] ACCESS_FINE_LOCATION: ${fine}`);

    if (fine !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new PrinterError('PERMISSION_DENIED', 'Permiso de ubicación denegado. Ábrelo en Configuración > Apps > Buhoneros App > Permisos.');
    }
    
    console.log('[Permisos] ✅ Permisos Android <12 otorgados');
  };

  // Race entre solicitud de permisos y timeout
  await Promise.race([requestPermissions(), timeoutPromise]);
}
