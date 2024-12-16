import mysql from 'mysql2/promise';

// Ensure all required environment variables are set
if (
  !process.env.TIDB_HOST ||
  !process.env.TIDB_PORT ||
  !process.env.TIDB_USER ||
  !process.env.TIDB_PASSWORD ||
  !process.env.TIDB_DATABASE ||
  !process.env.TIDB_SSL_CERT
) {
  console.error('TiDB environment variables are not properly configured');
  throw new Error('TiDB environment variables are required');
}

// SSL configuration
const sslConfig: mysql.SslOptions = {
  rejectUnauthorized: true, // Ensure SSL verification is enabled
  ca: process.env.TIDB_SSL_CERT, // Directly use the certificate from env var
};

// Create a MySQL connection pool
export const createPool = async () => {
  return mysql.createPool({
    host: process.env.TIDB_HOST!,
    port: parseInt(process.env.TIDB_PORT!, 10), // Ensure base 10 parsing
    user: process.env.TIDB_USER!,
    password: process.env.TIDB_PASSWORD!,
    database: process.env.TIDB_DATABASE!,
    ssl: sslConfig, // Use SSL configuration
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
};

let pool: mysql.Pool | null = null;

// Initialize the connection pool
export const initializePool = async () => {
  if (!pool) {
    try {
      pool = await createPool();
      console.log('TiDB connection pool initialized');
    } catch (error) {
      console.error('Failed to initialize TiDB connection pool:', error);
      throw error;
    }
  }
  return pool;
};

// Initialize the database schema
export const initializeDatabase = async () => {
  if (!pool) {
    await initializePool();
  }

  const connection = await pool!.getConnection();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        name VARCHAR(255),
        image VARCHAR(1000),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table initialized');
  } catch (error) {
    console.error('Error initializing users table:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Type for user data
type UserData = {
  id: string;
  email: string;
  username: string;
  password?: string;
  name?: string;
  image?: string;
};

// Save a user to the database
export async function saveUserToTiDB(userData: UserData) {
  if (!pool) {
    await initializePool();
  }

  const connection = await pool!.getConnection();
  try {
    const [result] = await connection.execute(
      'INSERT INTO users (id, email, username, password) VALUES (?, ?, ?, ?)',
      [userData.id, userData.email, userData.username, userData.password]
    );
    console.log('User saved to TiDB:', result);
    return result;
  } catch (error) {
    console.error('Error saving user to TiDB:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Check if a user exists in the database
export async function checkUserExistsInTiDB(email: string, username: string) {
  if (!pool) {
    await initializePool();
  }

  const connection = await pool!.getConnection();
  try {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    return rows[0].count > 0;
  } catch (error) {
    console.error('Error checking user in TiDB:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Close the connection pool
export const closePool = async () => {
  if (pool) {
    await pool.end();
    console.log('TiDB connection pool closed');
    pool = null; // Reset the pool
  }
};

// Initialize the pool and database schema
initializePool().catch(console.error);
initializeDatabase().catch(console.error);

export { pool };