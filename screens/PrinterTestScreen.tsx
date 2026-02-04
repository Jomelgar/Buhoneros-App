/**
 * SECCIÓN DE IMPRESIONES - NO MODIFICAR SIN REVISAR
 * 
 * Este componente contiene la funcionalidad completa de prueba de impresión Bluetooth.
 * Incluye drivers para Zebra (ZPL/CPCL) y genéricos (ESC/POS).
 * 
 * Características implementadas:
 * - Búsqueda de impresoras Bluetooth emparejadas
 * - Conexión/desconexión a impresoras
 * - Impresión de facturas demo
 * - Impresión de texto personalizado
 * - Scroll completo en lista de dispositivos
 * - Filtrado de impresoras (excluye teléfonos, relojes, etc.)
 * 
 * VERIFICADO Y FUNCIONAL - Última prueba: 2026-02-03
 */

import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Buffer } from 'buffer';

// SECCIÓN DE IMPRESIONES - Drivers de impresora
import { ZebraDriver } from '../printing/drivers/ZebraDriver';
import { EscPosDriver } from '../printing/drivers/EscPosDriver';
import type { PrinterDriver, BluetoothDeviceInfo } from '../printing/PrinterDriver';
import type { InvoiceData } from '../printing/types';
import { PrinterError } from '../printing/errors';

// SECCIÓN DE IMPRESIONES - Utilidad para imprimir texto directo (Zebra)
import { printTextZebra } from '../printing/zebraPrinter';

// SECCIÓN DE IMPRESIONES - Base de datos (para facturas demo)
import { loadDatabase, initDB, testDynamicDB, resetDatabase } from '../db';

/**
 * COMPONENTE DE PRUEBA DE IMPRESIÓN
 * 
 * Este componente es una pantalla de prueba completa para validar
 * la funcionalidad de impresión Bluetooth en la aplicación.
 * 
 * NO es la pantalla principal de la app.
 */
export default function PrinterTestScreen() {
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log('Iniciando aplicación...');
        await resetDatabase();
        const loadResult = await loadDatabase();
        
        if (loadResult === false) {
          console.log('No se encontró base de datos en assets, creando dinámicamente...');
          await initDB();
          await testDynamicDB();
        } else {
          console.log('Base de datos cargada exitosamente desde assets');
        }
      } catch (error) {
        console.error('Error al inicializar la Base de Datos:', error);
      }
    };
    
    initializeDatabase();
  }, []);

  const demoInvoice: InvoiceData = useMemo(
    () => ({
      invoiceNumber: 'F-000123',
      issuedAtISO: new Date().toISOString(),
      currency: 'HNL',
      business: {
        name: 'Buhoneros App Demo',
        addressLines: ['Tegucigalpa, Honduras'],
        phone: '+504 0000-0000',
      },
      customer: {
        name: 'Cliente Demo',
        id: '0801-0000-00000',
      },
      items: [
        { name: 'Producto A (nombre largo para probar wrap)', qty: 2, unitPriceCents: 15000 },
        { name: 'Producto B', qty: 1, unitPriceCents: 9999 },
      ],
      totals: {
        subtotalCents: 39999,
        taxCents: 0,
        discountCents: 0,
        totalCents: 39999,
      },
      notes: 'Gracias por su compra.',
      qrValue: 'https://example.com/factura/F-000123',
      barcodeValue: 'F000123',
    }),
    []
  );

  const [driverType, setDriverType] = useState<'zebra' | 'escpos'>('zebra');
  const [zebraLanguage, setZebraLanguage] = useState<'zpl' | 'cpcl'>('zpl');
  const [printWidthDots, setPrintWidthDots] = useState('812');
  const [paperWidthChars, setPaperWidthChars] = useState('48');
  const [customInvoiceText, setCustomInvoiceText] = useState('Cliente: Juan Perez\nProducto 1  1 x 50.00\nTOTAL: 50.00\nGracias por su compra');

  const [devices, setDevices] = useState<BluetoothDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Listo');
  const [error, setError] = useState<string | null>(null);

  const driverRef = useRef<PrinterDriver | null>(null);

  const buildDriver = () => {
    if (driverType === 'escpos') {
      return new EscPosDriver({
        paperWidthChars: Number(paperWidthChars) || 48,
      });
    }
    return new ZebraDriver({
      language: zebraLanguage,
      printWidthDots: Number(printWidthDots) || 812,
    });
  };

  useEffect(() => {
    // Recreate driver on config changes (disconnecting if needed)
    (async () => {
      try {
        setError(null);
        setStatus('Aplicando configuración de impresora...');
        setBusy(true);

        if (driverRef.current) {
          try {
            await driverRef.current.disconnect();
          } catch {
            // ignore
          }
        }
        driverRef.current = buildDriver();
        setConnectedDeviceId(null);
      } finally {
        setBusy(false);
        setStatus('Listo');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverType, zebraLanguage, printWidthDots, paperWidthChars]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const err = e as unknown;
      if (err instanceof PrinterError) {
        setError(`${err.code}: ${err.message}`);
        setStatus('Error');
      } else if (err instanceof Error) {
        setError(err.message);
        setStatus('Error');
      } else {
        setError(String(err));
        setStatus('Error');
      }
    } finally {
      setBusy(false);
    }
  };

  const onSearchPrinters = () =>
    run(async () => {
      if (!driverRef.current) driverRef.current = buildDriver();
      
      console.log('[App] Iniciando búsqueda de impresoras...');
      setStatus('Buscando impresoras emparejadas...');
      setDevices([]); // Limpiar lista anterior
      
      try {
        const found = await driverRef.current.listDevices();
        console.log(`[App] Búsqueda completada. Encontradas: ${found.length}`);
        
        // Filtrar solo impresoras (excluir teléfonos, auriculares, etc.)
        const printers = found.filter((device: BluetoothDeviceInfo) => {
          const name = (device.name || '').toLowerCase();
          // Incluir si contiene palabras clave de impresoras
          const isPrinter = 
            name.includes('printer') ||
            name.includes('print') ||
            name.includes('impresora') ||
            name.includes('zebra') ||
            name.includes('pt-') ||
            name.includes('rp') || // Común en impresoras térmicas
            name.includes('pos') ||
            name.includes('thermal') ||
            name.includes('receipt') ||
            name.includes('g00') || // Tu impresora PT-210
            name.includes('epson') ||
            name.includes('bixolon') ||
            name.includes('star') ||
            name.includes('zq');
          
          // Excluir si contiene palabras de otros dispositivos
          const isNotPrinter = 
            name.includes('phone') ||
            name.includes('galaxy') ||
            name.includes('buds') ||
            name.includes('airpods') ||
            name.includes('headset') ||
            name.includes('speaker') ||
            name.includes('watch') ||
            name.includes('tv');
          
          return isPrinter && !isNotPrinter;
        });
        
        console.log(`[App] Impresoras filtradas: ${printers.length} de ${found.length} dispositivos`);
        
        setDevices(printers);
        setSelectedDeviceId((prev) => prev ?? printers[0]?.id ?? null);
        
        if (printers.length === 0) {
          setStatus('❌ No se encontraron impresoras emparejadas.');
          setError('Empareja tu impresora PT-210 en: Configuración > Bluetooth del teléfono. Luego vuelve a buscar aquí.');
        } else {
          setStatus(`✅ Encontradas: ${printers.length} impresora${printers.length !== 1 ? 's' : ''}`);
          console.log('[App] Lista de impresoras:');
          printers.forEach((d: BluetoothDeviceInfo) => console.log(`  - ${d.name} (${d.address})`));
        }
      } catch (err) {
        console.error('[App] Error en búsqueda:', err);
        throw err; // Re-throw para que run() lo maneje
      }
    });

  const onConnect = () =>
    run(async () => {
      if (!driverRef.current) driverRef.current = buildDriver();
      if (!selectedDeviceId) throw new Error('Selecciona una impresora primero.');
      setStatus('Conectando...');
      await driverRef.current.connect(selectedDeviceId);
      setConnectedDeviceId(selectedDeviceId);
      setStatus('Conectado');
    });

  const onDisconnect = () =>
    run(async () => {
      if (!driverRef.current) return;
      setStatus('Desconectando...');
      await driverRef.current.disconnect();
      setConnectedDeviceId(null);
      setStatus('Desconectado');
    });

  const onPrintDemo = () =>
    run(async () => {
      if (!driverRef.current) driverRef.current = buildDriver();
      if (!connectedDeviceId) throw new Error('Conecta una impresora primero.');
      setStatus('Imprimiendo...');
      await driverRef.current.printInvoice(demoInvoice);
      setStatus('Enviado a impresora');
    });

  const onPrintTextDemo = () =>
    run(async () => {
      if (!driverRef.current) driverRef.current = buildDriver();
      if (!connectedDeviceId) throw new Error('Conecta una impresora primero.');

      // sendRaw bridges to the current Bluetooth connection.
      // In this project, drivers are backed by BluetoothClassicTransport.
      // If you later refactor drivers, keep a similar raw-sender hook here.
      const sendRaw = async (data: string | Uint8Array) => {
        const anyDriver = driverRef.current as any;
        if (!anyDriver?.transport?.write || !anyDriver?.device) {
          throw new Error('No hay conexión Bluetooth RAW disponible (TODO: conectar sendRaw al transporte).');
        }

        if (typeof data === 'string') {
          await anyDriver.transport.write(anyDriver.device, data, 'ascii');
        } else {
          await anyDriver.transport.write(anyDriver.device, Buffer.from(data));
        }
      };

      // Usar el texto personalizado del usuario
      const textTooPrint = customInvoiceText || 'FACTURA PRUEBA\nCliente: Juan Perez\nProducto 1  1 x 50.00\nTOTAL: 50.00\nGracias';

      setStatus('Imprimiendo texto...');
      await printTextZebra(textTooPrint, sendRaw, {
        widthDots: 812,
        marginDots: 30,
        fontHeight: 28,
        fontWidth: 28,
        lineGap: 7,
        topDots: 20,
        useUnicode: false,
      });
      setStatus('Texto enviado a impresora');
    });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Prueba de Impresión</Text>
        <Text style={styles.subtitle}>Bluetooth - Zebra / ESC/POS</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Driver</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.chip, driverType === 'zebra' && styles.chipActive]}
            onPress={() => setDriverType('zebra')}
            disabled={busy}
          >
            <Text style={[styles.chipText, driverType === 'zebra' && styles.chipTextActive]}>Zebra (ZPL/CPCL)</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, driverType === 'escpos' && styles.chipActive]}
            onPress={() => setDriverType('escpos')}
            disabled={busy}
          >
            <Text style={[styles.chipText, driverType === 'escpos' && styles.chipTextActive]}>Genérico (ESC/POS)</Text>
          </Pressable>
        </View>

        {driverType === 'zebra' ? (
          <View style={styles.row}>
            <Pressable
              style={[styles.chipSmall, zebraLanguage === 'zpl' && styles.chipActive]}
              onPress={() => setZebraLanguage('zpl')}
              disabled={busy}
            >
              <Text style={[styles.chipText, zebraLanguage === 'zpl' && styles.chipTextActive]}>ZPL</Text>
            </Pressable>
            <Pressable
              style={[styles.chipSmall, zebraLanguage === 'cpcl' && styles.chipActive]}
              onPress={() => setZebraLanguage('cpcl')}
              disabled={busy}
            >
              <Text style={[styles.chipText, zebraLanguage === 'cpcl' && styles.chipTextActive]}>CPCL</Text>
            </Pressable>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ancho (dots)</Text>
              <TextInput
                value={printWidthDots}
                onChangeText={setPrintWidthDots}
                keyboardType="numeric"
                style={styles.input}
                editable={!busy}
              />
            </View>
          </View>
        ) : (
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ancho (chars)</Text>
              <TextInput
                value={paperWidthChars}
                onChangeText={setPaperWidthChars}
                keyboardType="numeric"
                style={styles.input}
                editable={!busy}
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones</Text>
        <View style={styles.row}>
          <Pressable style={styles.buttonAction} onPress={onSearchPrinters} disabled={busy}>
            <Text style={styles.buttonActionText}>🔍 Buscar impresoras</Text>
          </Pressable>
          <Pressable style={styles.buttonAction} onPress={onConnect} disabled={busy || !selectedDeviceId}>
            <Text style={styles.buttonActionText}>🔗 Conectar</Text>
          </Pressable>
          <Pressable style={styles.buttonAction} onPress={onDisconnect} disabled={busy || !connectedDeviceId}>
            <Text style={styles.buttonActionText}>❌ Desconectar</Text>
          </Pressable>
        </View>

        <View style={styles.invoiceInputContainer}>
          <Text style={styles.label}>Texto de factura (usa \n para saltos de línea):</Text>
          <TextInput
            style={styles.invoiceInput}
            value={customInvoiceText}
            onChangeText={setCustomInvoiceText}
            multiline
            numberOfLines={6}
            placeholder="Cliente: Juan Perez\nProducto 1  1 x 50.00\nTOTAL: 50.00\nGracias"
            editable={!busy}
          />
        </View>

        <Pressable style={styles.buttonPrint} onPress={onPrintDemo} disabled={busy || !connectedDeviceId}>
          <Text style={styles.buttonPrintText}>📄 Imprimir factura demo</Text>
        </Pressable>

        <Pressable style={styles.buttonPrint} onPress={onPrintTextDemo} disabled={busy || !connectedDeviceId}>
          <Text style={styles.buttonPrintText}>🖨️ Imprimir texto personalizado</Text>
        </Pressable>

        <View style={styles.statusRow}>
          {busy ? <ActivityIndicator /> : null}
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Impresoras disponibles</Text>
        <ScrollView style={styles.deviceList} nestedScrollEnabled={true}>
          {devices.length === 0 ? (
            <Text style={styles.subtitle}>Aún no has buscado impresoras.</Text>
          ) : (
            devices.map((item) => {
              const selected = item.id === selectedDeviceId;
              const connected = item.id === connectedDeviceId;
              return (
                <Pressable
                  key={item.id}
                  style={[styles.deviceRow, selected && styles.deviceRowSelected]}
                  onPress={() => setSelectedDeviceId(item.id)}
                  disabled={busy}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName}>{item.name || 'Sin nombre'}</Text>
                    <Text style={styles.deviceMeta}>
                      {item.address} {item.bonded ? '• emparejado' : '• descubierto'}
                    </Text>
                  </View>
                  {connected ? <Text style={styles.connectedTag}>Conectado</Text> : null}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#111' },
  subtitle: { marginTop: 6, fontSize: 13, color: '#666' },

  section: { marginTop: 14, padding: 12, borderWidth: 1, borderColor: '#eee', borderRadius: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10, color: '#111' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', alignItems: 'center' },

  deviceList: { maxHeight: 400 }, // Scroll completo para ver todas las impresoras

  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#ddd' },
  chipSmall: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: '#ddd' },
  chipActive: { backgroundColor: '#111', borderColor: '#111' },
  chipText: { color: '#111' },
  chipTextActive: { color: '#fff' },

  inputGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: '#444', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    minWidth: 80,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },

  invoiceInputContainer: { marginTop: 12, marginBottom: 8 },
  invoiceInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
  },

  button: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  buttonAction: { 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    borderRadius: 10, 
    backgroundColor: '#2196F3',
    minWidth: 100,
    alignItems: 'center',
  },
  buttonActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  
  buttonPrint: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    marginTop: 10,
    alignItems: 'center',
  },
  buttonPrintText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  
  buttonPrimary: { backgroundColor: '#ffffff', borderColor: '#454545', marginTop: 10 },
  buttonText: { color: '#111', fontWeight: '600' },

  statusRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 10 },
  statusText: { color: '#333' },
  errorText: { marginTop: 8, color: '#b00020' },

  deviceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10, borderRadius: 10 },
  deviceRowSelected: { backgroundColor: '#f2f2f2' },
  deviceName: { fontSize: 14, fontWeight: '600', color: '#111' },
  deviceMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  connectedTag: { fontSize: 12, fontWeight: '700', color: '#0a7a0a' },
});
