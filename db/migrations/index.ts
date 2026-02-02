//Aqui van las migraciones de drizzle
export const runMigrations = async (db: any) => {
  console.log('Ejecutando migraciones...');
  
  try {
    // Crear la tabla users manualmente con SQL crudo
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL
      )
    `);
    console.log('Tabla users creada exitosamente');
  } catch (error) {
    console.error('Error al crear tabla users:', error);
    throw error;
  }
};
