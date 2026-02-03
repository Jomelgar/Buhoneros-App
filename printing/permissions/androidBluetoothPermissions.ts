import { PermissionsAndroid, Platform } from 'react-native';
import { PrinterError } from '../errors';

export async function ensureAndroidBluetoothPermissions(): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new PrinterError('UNSUPPORTED_PLATFORM', 'Bluetooth printing is only implemented for Android in this project.');
  }

  const api = typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;

  // Android 12+ (API 31+) uses BLUETOOTH_* runtime permissions
  if (api >= 31) {
    const scan = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, {
      title: 'Permiso Bluetooth (scan)',
      message: 'Se requiere para buscar impresoras cercanas por Bluetooth.',
      buttonNegative: 'Cancelar',
      buttonPositive: 'Permitir',
    });
    if (scan !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new PrinterError('PERMISSION_DENIED', 'Permiso BLUETOOTH_SCAN denegado.');
    }

    const connect = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, {
      title: 'Permiso Bluetooth (connect)',
      message: 'Se requiere para conectar con la impresora por Bluetooth.',
      buttonNegative: 'Cancelar',
      buttonPositive: 'Permitir',
    });
    if (connect !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new PrinterError('PERMISSION_DENIED', 'Permiso BLUETOOTH_CONNECT denegado.');
    }

    return;
  }

  // Android 11 and lower: discovery requires location permission
  const fine = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
    title: 'Permiso de ubicación',
    message: 'Android requiere ubicación para buscar dispositivos Bluetooth.',
    buttonNegative: 'Cancelar',
    buttonPositive: 'Permitir',
  });

  if (fine !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new PrinterError('PERMISSION_DENIED', 'Permiso ACCESS_FINE_LOCATION denegado.');
  }
}
