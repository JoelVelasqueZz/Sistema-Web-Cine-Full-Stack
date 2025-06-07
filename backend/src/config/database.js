const { Pool } = require('pg');

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  
  // Configuraciones adicionales de la conexión
  max: 20, // máximo número de conexiones en el pool
  idleTimeoutMillis: 30000, // tiempo antes de cerrar conexiones inactivas
  connectionTimeoutMillis: 2000, // tiempo de espera para establecer conexión
});

// Función para conectar a la base de datos
const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexión exitosa a PostgreSQL');
    console.log(`Base de datos: ${process.env.DB_NAME}`);
    console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    // Probar la conexión
    const result = await client.query('SELECT NOW()');
    console.log(`Servidor de BD: ${result.rows[0].now}`);

    client.release();
    return pool;
  } catch (error) {
    console.error('Error conectando a PostgreSQL:', error.message);
    throw error;
  }
};

// Función para ejecutar queries
const query = async (text, params) => {
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Query ejecutado en ${duration}ms:`, text.slice(0, 50) + '...');
    }
    
    return result;
  } catch (error) {
    console.error('Error en query:', error.message);
    console.error('Query:', text);
    console.error('Parámetros:', params);
    throw error;
  }
};

// Función para transacciones
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Función para cerrar la conexión (útil para tests)
const closeDB = async () => {
  await pool.end();
  console.log('Conexión a PostgreSQL cerrada');
};

// Event listeners para debugging
pool.on('connect', () => {
  console.log('🔗 Nueva conexión establecida al pool de PostgreSQL');
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
  process.exit(-1);
});

module.exports = {
  pool,
  query,
  connectDB,
  transaction,
  closeDB
};