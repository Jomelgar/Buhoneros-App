# Configuración de Impresoras Bluetooth Portátiles

## Requisitos previos

Para usar las impresoras portátiles Bluetooth con esta app, necesitas:

1. **Impresora Bluetooth portátil** (ESC/POS compatible o Zebra)
2. **Android 6.0 o superior**
3. **Permisos Bluetooth** (la app los solicita automáticamente)

## Cómo emparejar tu impresora

### Paso 1: Enciende la impresora
- Enciende tu impresora portátil
- Asegúrate de que tenga carga y papel
- Espera a que el LED Bluetooth esté parpadeando (modo emparejamiento)

### Paso 2: Empareja desde Configuración de Android
1. Abre **Configuración** en tu dispositivo Android
2. Ve a **Conexiones** > **Bluetooth** (o **Dispositivos conectados** > **Bluetooth**)
3. Asegúrate de que Bluetooth esté **activado**
4. Busca tu impresora en "Dispositivos disponibles"
5. Toca el nombre de tu impresora para emparejar
6. Si te pide un PIN, prueba: `0000`, `1234`, o `1111` (común en impresoras térmicas)

### Paso 3: Usa la app
1. Abre **Buhoneros App**
2. Selecciona el tipo de impresora:
   - **Genérico (ESC/POS)** para impresoras térmicas comunes (58mm o 80mm)
   - **Zebra (ZPL/CPCL)** para impresoras Zebra portátiles
3. Presiona **"Buscar impresoras"**
4. Selecciona tu impresora de la lista
5. Presiona **"Conectar"**
6. Prueba con **"Imprimir texto de prueba"** o **"Imprimir factura demo"**

## Solución de problemas

### No aparece mi impresora en la lista
- ✅ Verifica que esté **emparejada** en Configuración > Bluetooth (no solo conectada)
- ✅ Asegúrate de que esté **encendida** y cerca del teléfono
- ✅ Presiona "Buscar impresoras" de nuevo después de emparejar

### Error al conectar
- ✅ Desempareja y vuelve a emparejar la impresora desde Configuración de Android
- ✅ Reinicia la impresora
- ✅ Asegúrate de que no esté conectada a otro dispositivo

### La impresión es muy lenta
- ✅ Acércate a la impresora (menos de 2 metros)
- ✅ Verifica la carga de la impresora
- ✅ Usa papel de calidad recomendado por el fabricante
- ✅ Si tienes muchos artículos (>20), la factura se truncará automáticamente para mejor rendimiento

### No imprime nada
- ✅ Verifica que tenga **papel** cargado correctamente
- ✅ Prueba primero con "Imprimir texto de prueba" (más simple)
- ✅ Confirma que el tipo de impresora sea correcto (ESC/POS vs Zebra)

## Tipos de impresoras soportadas

### Genérico (ESC/POS)
- Impresoras térmicas de 58mm y 80mm
- Marcas comunes: Epson, Star Micronics, Bixolon, etc.
- Protocolo estándar ESC/POS
- **Configuración recomendada**: 48 caracteres (80mm) o 32 caracteres (58mm)

### Zebra (ZPL/CPCL)
- Zebra ZQ series (ZQ110, ZQ220, ZQ320, ZQ521, etc.)
- Protocolo ZPL (Zebra Programming Language) o CPCL
- **Configuración recomendada**: 812 dots (4" @ 203dpi)

## Rendimiento optimizado

Esta versión incluye mejoras de rendimiento:
- ✅ Búsqueda **instantánea** de impresoras emparejadas (sin discovery lento)
- ✅ Conexión **rápida** con verificación de estado
- ✅ Envío en **chunks** para evitar overflow del buffer
- ✅ Límite de **20 artículos** por factura (impresión más rápida)
- ✅ Mejor manejo de errores con mensajes claros

## Soporte

Si tienes problemas:
1. Verifica los permisos Bluetooth en Configuración > Apps > Buhoneros App > Permisos
2. Reinicia la app
3. Reinicia el Bluetooth del dispositivo
4. Reinicia la impresora
