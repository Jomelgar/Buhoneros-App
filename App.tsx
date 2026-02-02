import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect } from 'react';
import { loadDatabase, initDB, testDynamicDB, resetDatabase } from './db';

const initializeDatabase = async () => {
  try {
    console.log('Iniciando aplicación...');
    
    // Limpiar la base de datos existente para evitar conflictos
    await resetDatabase();
    
    // Intentar cargar desde assets primero
    const loadResult = await loadDatabase();
    
    if (loadResult === false) {
      console.log('No se encontró base de datos en assets, creando dinámicamente...');
      
      // Si no existe el asset, crear dinámicamente
      await initDB();
      
      // Probar la base de datos dinámica
      await testDynamicDB();
    } else {
      console.log('Base de datos cargada exitosamente desde assets');
    }
  } catch (error) {
    console.error('Error al inicializar la Base de Datos:', error);
  }
};

export default function App() {
  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Buhoneros App</Text>
      <Text style={styles.subtitle}>Ver logs de la carga de la DB en consola</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
