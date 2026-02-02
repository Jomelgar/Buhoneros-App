import * as FileSystem from "expo-file-system/legacy";
import * as SQLite from "expo-sqlite";
import { Asset } from "expo-asset";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { runMigrations } from "./migrations";
import { users } from "./models";

//Si mandan una db de sqlite por medio de assets, deben cambiar el nombre del archivo en esta variable
const DB_NAME = "mySQLiteDB.db";
let db: any = null;

//Esta funcion es para cargar la base de datos desde assets
export const loadDatabase = async () => {
  try {
    console.log('Cargando Base de Datos desde Assets...');

    // Cargar asset de la base de datos
    let asset;
    try {
      asset = Asset.fromModule(require('../assets/mySQLiteDB.db')); //Aqui tamvien deben cambiarlo (No se puede poner variable, hay que hardcodear el nombre del archivo )
    } catch (requireError) {
      // Si no existe el archivo, retornar false para indicar que debe usar BD dinámica
      console.log('No se encontró archivo de base de datos en assets');
      return false;
    }
    
    await asset.downloadAsync();

    if (!asset.localUri) {
      throw new Error('Error al cargar la base de datos desde assets');
    }

    console.log('Asset cargado:', asset.localUri);

    // Paths para copiar
    const dbDir = `${FileSystem.documentDirectory}SQLite`;
    const dbPath = `${dbDir}/${DB_NAME}`;

    // Se crea el directorio si no existe
    const dirInfo = await FileSystem.getInfoAsync(dbDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
      console.log('Directoriod de SQLite creado en dispositivo');
    }

    // Se copia la base de datos si no existe al dispositivo
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      await FileSystem.copyAsync({
        from: asset.localUri,
        to: dbPath,
      });
      console.log('Base de datos copiada a:', dbPath);
    } else {
      console.log('La Base de Datos ya existe en el dispositivo');
    }

    // Abrir la base de datos con SQLite y mandarsela a Drizzle
    const dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    db = drizzle(dbInstance);
    console.log('Drizzle ORM ya esta listo para usar');

    //await runMigrations(db); Aqui pueden correrse migraciones

    return db;

  } catch (error) {
    console.error('Error al cargar la Base de Datos:', error);
    throw error;
  }
};

//Esta funcion es para inicializar la base de datos desde cero (sin assets) 
export const initDB = async () => {
  if (db) return db;
  
  const dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  db = drizzle(dbInstance);
  console.log("Base de Datos creada DINAMICAMENTE");
  await runMigrations(db);
  return db;
};

// Función para probar la base de datos dinámica
export const testDynamicDB = async () => {
  try {
    console.log('🧪 Probando base de datos dinámica...');
    
    // Insertar un usuario de prueba
    const result = await db.insert(users).values({
      name: 'Usuario Test',
      email: 'test@example.com',
      createdAt: new Date()
    }).returning();
    
    console.log('Usuario insertado:', result);
    
    // Consultar todos los usuarios
    const allUsers = await db.select().from(users);
    console.log('Todos los usuarios:', allUsers);
    
    return allUsers;
  } catch (error) {
    console.error('Error en prueba de base de datos:', error);
    throw error;
  }
};

export const resetDatabase = async () => {
  try {
    console.log('Limpiando Base de Datos ...');
    
    const dbDir = `${FileSystem.documentDirectory}SQLite`;
    const dbPath = `${dbDir}/${DB_NAME}`;
    console.log('Ruta de la Base de Datos:', dbPath);
    
    // Check if file exists before deleting
    const fileInfo = await FileSystem.getInfoAsync(dbPath);
    console.log('¿Existe el archivo?', fileInfo.exists);
    
    if (fileInfo.exists) {
      // Delete the database file
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
      console.log('Archivo de Base de Datos eliminado');
    } else {
      console.log('ℹEl archivo de Base de Datos no existe');
    }
    
    // Reset the db instance
    db = null;
    
    console.log('Base de Datos reseteada');
  } catch (error) {
    console.error('Error al resetear la Base de Datos:', error);
    throw error;
  }
};

export const getDB = () => {
  if (!db) throw new Error("Database not initialized. Call loadDatabase() or initDB() first.");
  return db;
};
