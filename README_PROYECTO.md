# Buhoneros App - Documentación del Proyecto

**Fecha de inicio:** 2026-02-03  
**Versión:** 1.0.0

## 📋 Estructura del Proyecto

```
Buhoneros-App/
├── App.tsx                    # ← PANTALLA PRINCIPAL (vacía, en desarrollo)
├── screens/
│   └── PrinterTestScreen.tsx  # ← PANTALLA DE PRUEBA DE IMPRESIÓN (funcional)
├── printing/                  # ← MÓDULO DE IMPRESIÓN (NO MODIFICAR SIN REVISAR)
│   ├── drivers/               # Drivers de impresoras
│   ├── render/                # Renderizadores de facturas
│   ├── transport/             # Comunicación Bluetooth
│   ├── permissions/           # Permisos de Android
│   └── utils/                 # Utilidades
├── db/                        # Base de datos SQLite
└── assets/                    # Assets de la app
```

## ⚠️ IMPORTANTE - NO MODIFICAR

### Módulo de Impresión Bluetooth

El módulo de impresión (`./printing/`) está **VERIFICADO Y FUNCIONAL** (última prueba: 2026-02-03).

**NO modificar sin revisar** los siguientes archivos:
- `printing/drivers/ZebraDriver.ts` - Driver para impresoras Zebra (ZPL/CPCL)
- `printing/drivers/EscPosDriver.ts` - Driver para impresoras genéricas (ESC/POS, PT-210)
- `printing/transport/BluetoothClassicTransport.ts` - Comunicación Bluetooth
- `printing/render/renderInvoiceToEscPos.ts` - Renderizador ESC/POS optimizado
- `screens/PrinterTestScreen.tsx` - Pantalla de prueba completa

## ✅ Funcionalidades Implementadas

### Impresión Bluetooth
- ✅ Búsqueda de impresoras Bluetooth emparejadas
- ✅ Filtrado automático (excluye teléfonos, relojes, auriculares)
- ✅ Conexión/desconexión a impresoras
- ✅ Impresión de facturas demo
- ✅ Impresión de texto personalizado
- ✅ Scroll completo en lista de dispositivos
- ✅ Drivers para Zebra (ZPL/CPCL) y ESC/POS
- ✅ Optimización de rendimiento (timeouts, chunking)

### Base de Datos
- ✅ Inicialización desde assets o dinámica
- ✅ Soporte SQLite con Expo

## 🔧 Configuración Técnica

### Impresoras Compatibles
- **Zebra:** ZPL/CPCL (etiquetas)
- **Genéricas:** ESC/POS (térmicas como PT-210, Epson, Bixolon, Star)

### Timeouts Configurados
- Búsqueda de dispositivos emparejados: 5 segundos
- Búsqueda de dispositivos nuevos (discovery): 8 segundos
- Timeout global de búsqueda: 15 segundos
- Permisos: 10 segundos

### Optimizaciones
- Escritura en chunks de 512 bytes con delay de 10ms
- Límite de 20 items por factura
- Buffer directo en ESC/POS (sin concatenación de strings)

## �️ Sección de Impresión Bluetooth - Documentación Completa

### Descripción General
El módulo de impresión Bluetooth permite conectar e imprimir en impresoras térmicas usando los protocolos Zebra (ZPL/CPCL) y ESC/POS.

### Ubicación del Código
- **Componente de prueba:** `./screens/PrinterTestScreen.tsx`
- **Módulo principal:** `./printing/`
- **Backup del código original:** `App.tsx.backup`

### ¿Cómo Activar la Pantalla de Impresión?

Para usar la funcionalidad de impresión, modifica temporalmente `App.tsx`:

```tsx
// En lugar de exportar el componente principal:
export default function App() { ... }

// Importa y exporta la pantalla de prueba:
import PrinterTestScreen from './screens/PrinterTestScreen';
export default PrinterTestScreen;
```

O simplemente:
```tsx
import PrinterTestScreen from './screens/PrinterTestScreen';

export default function App() {
  return <PrinterTestScreen />;
}
```

### Funcionalidades Implementadas

#### 1. Búsqueda de Impresoras
- Escanea dispositivos Bluetooth emparejados
- Filtra automáticamente impresoras (excluye teléfonos, relojes, auriculares)
- Keywords de filtrado incluyen: `printer`, `pt-`, `zebra`, `g00`, `epson`, `bixolon`, `star`, `pos`, `thermal`
- Keywords excluidas: `phone`, `galaxy`, `buds`, `watch`, `speaker`, `tv`

#### 2. Drivers Soportados
- **Zebra (ZPL/CPCL):** Para impresoras de etiquetas Zebra
  - Ancho configurable en dots (por defecto: 812)
  - Soporta ZPL y CPCL
- **ESC/POS:** Para impresoras térmicas genéricas
  - Ancho configurable en caracteres (por defecto: 48)
  - Compatible con PT-210, Epson, Bixolon, Star, etc.

#### 3. Tipos de Impresión
- **Factura Demo:** Imprime una factura de ejemplo pre-configurada
- **Texto Personalizado:** Campo editable para imprimir cualquier texto
  - Usa `\n` para saltos de línea
  - Por defecto: "Cliente: Juan Perez\nProducto 1  1 x 50.00\nTOTAL: 50.00\nGracias por su compra"

#### 4. Interfaz de Usuario
- **Botones azules (#2196F3):** Buscar, Conectar, Desconectar
- **Botones verdes (#4CAF50):** Imprimir factura demo, Imprimir texto personalizado
- **Scroll completo:** maxHeight 400px para ver todas las impresoras
- **Sin alertas:** Mensajes de error removidos, solo status visible

### Optimizaciones Técnicas

#### Timeouts Configurados
```typescript
- Dispositivos emparejados (bonded): 5 segundos
- Discovery de nuevos dispositivos: 8 segundos  
- Timeout global de búsqueda: 15 segundos
- Permisos de Android: 10 segundos
```

#### Escritura de Datos
- **Chunking:** Divide datos en bloques de 512 bytes
- **Delay entre chunks:** 10ms para evitar saturación del buffer Bluetooth
- **Límite de items en factura:** 20 items máximo para rendimiento óptimo

#### Renderizado ESC/POS
- Usa `Buffer.concat()` en lugar de concatenación de strings
- Comandos nativos ESC/POS:
  - `INIT`: `\x1B\x40` (resetear impresora)
  - `BOLD_ON/OFF`: `\x1B\x45\x01` / `\x1B\x45\x00`
  - `ALIGN_CENTER/LEFT`: `\x1B\x61\x01` / `\x1B\x61\x00`
  - `FEED`: `\x0A` (salto de línea)
  - `CUT`: `\x1D\x56\x00` (cortar papel)

### Arquitectura del Módulo

```
printing/
├── drivers/
│   ├── BaseBluetoothClassicDriver.ts   # Clase base con lógica común
│   ├── ZebraDriver.ts                  # Driver Zebra (ZPL/CPCL)
│   └── EscPosDriver.ts                 # Driver ESC/POS
├── transport/
│   └── BluetoothClassicTransport.ts    # Comunicación Bluetooth low-level
├── render/
│   ├── renderInvoiceToZpl.ts           # Renderizador ZPL
│   ├── renderInvoiceToCpcl.ts          # Renderizador CPCL
│   └── renderInvoiceToEscPos.ts        # Renderizador ESC/POS (optimizado)
├── permissions/
│   └── androidBluetoothPermissions.ts  # Manejo de permisos Android
├── utils/
│   ├── printTextZebra.ts               # Utilidad para imprimir texto simple
│   ├── text.ts                         # Utilidades de texto
│   └── format.ts                       # Formateo de números/moneda
├── types/
│   ├── PrinterDriver.ts                # Interfaz principal del driver
│   ├── InvoiceData.ts                  # Estructura de datos de factura
│   └── BluetoothDeviceInfo.ts          # Info de dispositivo Bluetooth
├── errors.ts                           # Códigos de error personalizados
├── polyfills.ts                        # Polyfills de Buffer y crypto
└── index.ts                            # Exportación pública del módulo
```

### Uso Programático del Módulo

#### Ejemplo Básico - Conectar e Imprimir
```typescript
import { EscPosDriver } from './printing';

const driver = new EscPosDriver({ paperWidthChars: 48 });

// 1. Buscar impresoras
const devices = await driver.listDevices();

// 2. Conectar a la primera impresora encontrada
await driver.connect(devices[0].id);

// 3. Imprimir factura
const invoice = {
  invoiceNumber: 'F-000001',
  issuedAtISO: new Date().toISOString(),
  currency: 'HNL',
  business: { name: 'Mi Negocio', addressLines: ['Tegucigalpa'], phone: '9999-9999' },
  customer: { name: 'Cliente', id: '0801-0000-00000' },
  items: [
    { name: 'Producto 1', qty: 2, unitPriceCents: 5000 }
  ],
  totals: { subtotalCents: 10000, taxCents: 0, discountCents: 0, totalCents: 10000 },
  notes: 'Gracias por su compra',
};

await driver.printInvoice(invoice);

// 4. Desconectar
await driver.disconnect();
```

#### Ejemplo Avanzado - Texto Personalizado con Zebra
```typescript
import { printTextZebra } from './printing';

// Función para enviar datos raw (necesita acceso al transport)
const sendRaw = async (data: string | Uint8Array) => {
  const transport = (driver as any).transport;
  const device = (driver as any).device;
  
  if (typeof data === 'string') {
    await transport.write(device, data, 'ascii');
  } else {
    await transport.write(device, Buffer.from(data));
  }
};

// Imprimir texto con configuración personalizada
await printTextZebra(
  'FACTURA\nCliente: Juan\nTotal: L. 100.00',
  sendRaw,
  {
    widthDots: 812,
    marginDots: 30,
    fontHeight: 28,
    fontWidth: 28,
    lineGap: 7,
    topDots: 20,
    useUnicode: false,
  }
);
```

### Permisos Requeridos (Android)

#### API 31+ (Android 12+)
```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

#### API < 31 (Android 11-)
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

El módulo detecta automáticamente la versión de Android y solicita los permisos correctos.

### Troubleshooting

#### Impresora no aparece en la lista
1. Verifica que la impresora esté emparejada en Configuración > Bluetooth del teléfono
2. Asegúrate de que la impresora esté encendida
3. Revisa que el nombre de la impresora contenga alguna keyword de filtro

#### Timeout al buscar dispositivos
- Normal si no hay impresoras cercanas sin emparejar
- El timeout de discovery (8s) es esperado si solo hay dispositivos emparejados

#### No funciona en Expo Go
- La impresión Bluetooth **requiere Expo Dev Client**
- Instalar con: `npx expo run:android`
- NO funciona en emulador, solo en dispositivo físico

#### Error "Permission denied"
- Acepta los permisos de Bluetooth cuando la app los solicite
- Si ya negaste los permisos, ve a Configuración > Apps > Buhoneros App > Permisos

### Impresoras Probadas

| Marca/Modelo | Tipo | Driver | Estado |
|--------------|------|--------|--------|
| G00JPRT PT-210 | Térmica | ESC/POS | ✅ Funcional |
| Zebra ZPL | Etiquetas | Zebra ZPL | ⚠️ No probado |
| Genérica ESC/POS | Térmica | ESC/POS | ✅ Compatible |

### Mejoras Futuras
- [ ] Agregar preview de factura antes de imprimir
- [ ] Soporte para imágenes/logos
- [ ] Configuración de tamaño de fuente en UI
- [ ] Guardado de impresoras favoritas
- [ ] Reconexión automática
- [ ] Soporte para Bluetooth Low Energy (BLE)

---

**Última actualización:** 2026-02-03  
**Verificado y funcional** en Samsung Galaxy S23 Ultra (Android API 36)

## �🚀 Cómo Probar la Impresión

1. Abre el archivo `screens/PrinterTestScreen.tsx`
2. Importa el componente en `App.tsx` (temporalmente):
   ```tsx
   import PrinterTestScreen from './screens/PrinterTestScreen';
   
   export default function App() {
     return <PrinterTestScreen />;
   }
   ```
3. Ejecuta la app en dispositivo físico (NO funciona en Expo Go)
4. Asegúrate de tener Dev Client instalado: `npx expo run:android`

## 📱 Requisitos

- **Expo SDK:** 54
- **React Native:** 0.81.5
- **Android:** API 24+ (recomendado API 31+ para permisos Bluetooth modernos)
- **Dispositivo físico** con Bluetooth (no funciona en emulador)
- **Expo Dev Client** (no Expo Go)

## 🛠️ Comandos Útiles

```bash
# Instalar Dev Client (necesario para Bluetooth)
npx expo run:android

# Iniciar servidor de desarrollo
npx expo start --dev-client --host lan

# Ver logs en tiempo real (PowerShell)
.\watch-logs.ps1
```

## 📦 Dependencias Clave

- `react-native-bluetooth-classic` v1.73.0-rc.17
- `expo-sqlite` 16.0.10
- `buffer` (polyfill para Buffer en React Native)

## 🔜 Próximos Pasos

1. Diseñar interfaz principal de la app
2. Implementar gestión de productos
3. Implementar gestión de clientes
4. Crear sistema de facturación
5. Integrar módulo de impresión con facturas reales

---

**Nota:** Este proyecto está en etapa inicial de desarrollo. La funcionalidad de impresión Bluetooth está completa y probada, lista para ser integrada en el flujo principal de la aplicación.
