/**
 * BUHONEROS APP - PANTALLA PRINCIPAL
 * 
 * Esta es la pantalla principal de la aplicación Buhoneros.
 * Proyecto iniciado: 2026-02-03
 * 
 * NOTA: La funcionalidad de prueba de impresión está en ./screens/PrinterTestScreen.tsx
 */

import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { loadDatabase, initDB, testDynamicDB, resetDatabase } from './db';

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

/**
 * COMPONENTE PRINCIPAL DE LA APLICACIÓN
 */
export default function App() {
  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Buhoneros App</Text>
        <Text style={styles.subtitle}>Aplicación de gestión de ventas</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>🚀 Versión: 1.0.0</Text>
          <Text style={styles.infoText}>📅 {new Date().toLocaleDateString('es-HN')}</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>Estado del proyecto:</Text>
          <Text style={styles.statusItem}>✅ Base de datos inicializada</Text>
          <Text style={styles.statusItem}>✅ Módulo de impresión Bluetooth funcional</Text>
          <Text style={styles.statusItem}>⏳ Interfaz principal en desarrollo</Text>
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>📝 Nota para desarrolladores:</Text>
          <Text style={styles.noteText}>
            La prueba de impresión Bluetooth está disponible en:{'\n'}
            <Text style={styles.codeText}>./screens/PrinterTestScreen.tsx</Text>
          </Text>
        </View>
      </View>
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 4,
  },
  statusBox: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#90caf9',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 12,
  },
  statusItem: {
    fontSize: 14,
    color: '#333',
    marginVertical: 4,
  },
  noteBox: {
    backgroundColor: '#fff3e0',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f57c00',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  codeText: {
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 4,
    borderRadius: 4,
  },
});
