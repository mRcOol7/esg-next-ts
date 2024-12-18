import mysql from 'mysql2/promise';
import crypto from 'crypto';

// Ensure all required environment variables are set
const requiredEnvVars = [
  'TIDB_HOST',
  'TIDB_PORT',
  'TIDB_USER',
  'TIDB_PASSWORD',
  'TIDB_DATABASE'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required TiDB environment variables:', missingEnvVars);
  throw new Error('Required TiDB environment variables are missing');
}

// SSL configuration
const sslConfig: mysql.SslOptions = {
  rejectUnauthorized: process.env.NODE_ENV === 'production', // Only enforce in production
  minVersion: 'TLSv1.2'
};

// Add CA certificate if provided
if (process.env.TIDB_SSL_CERT) {
  sslConfig.ca = process.env.TIDB_SSL_CERT;
}

// Create a MySQL connection pool
export const createPool = async () => {
  return mysql.createPool({
    host: process.env.TIDB_HOST!,
    port: parseInt(process.env.TIDB_PORT!, 10),
    user: process.env.TIDB_USER!,
    password: process.env.TIDB_PASSWORD!,
    database: process.env.TIDB_DATABASE!,
    ssl: sslConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
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
  const pool = await createPool();
  try {
    console.log('Starting database initialization...');
    
    // Create users table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) DEFAULT '',
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        name VARCHAR(255),
        image VARCHAR(1024),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email (email)
      )
    `);
    console.log('Users table created or verified');

    // Create social_providers table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS social_providers (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        provider_user_id VARCHAR(255) NOT NULL,
        provider_email VARCHAR(255),
        provider_username VARCHAR(255),
        provider_name VARCHAR(255),
        provider_image VARCHAR(1024),
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_provider_user (provider, provider_user_id)
      )
    `);
    console.log('Social providers table created or verified');
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  } finally {
    await pool.end();
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
    // Build the query dynamically based on provided fields
    const fields = ['id', 'username', 'email']; // Always include required fields
    const values = [userData.id, userData.username, userData.email || '']; 
    const updateFields = [];
    
    if (userData.password !== undefined) {
      fields.push('password');
      values.push(userData.password);
      updateFields.push('password = VALUES(password)');
    }
    if (userData.name !== undefined) {
      fields.push('name');
      values.push(userData.name);
      updateFields.push('name = VALUES(name)');
    }
    if (userData.image !== undefined) {
      fields.push('image');
      values.push(userData.image);
      updateFields.push('image = VALUES(image)');
    }

    // Create UPSERT query
    const query = `
      INSERT INTO users (${fields.join(', ')}) 
      VALUES (${fields.map(() => '?').join(', ')})
      ON DUPLICATE KEY UPDATE
      username = VALUES(username),
      ${updateFields.join(', ')}
    `;
    
    console.log('Executing query:', query, 'with values:', values);
    const [result] = await connection.execute(query, values);
    
    console.log('User saved/updated in TiDB:', result);
    return result;
  } catch (error) {
    console.error('Error saving user to TiDB:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Check if a user exists in the database
export async function checkUserExistsInTiDB(email: string | undefined, username: string) {
  if (!pool) {
    await initializePool();
  }

  const connection = await pool!.getConnection();
  try {
    // Build query based on available parameters
    let query = 'SELECT COUNT(*) as count FROM users WHERE ';
    const params = [];
    
    if (email) {
      query += 'email = ? OR username = ?';
      params.push(email, username);
    } else {
      query += 'username = ?';
      params.push(username);
    }

    const [rows] = await connection.execute<mysql.RowDataPacket[]>(query, params);
    return rows[0].count > 0;
  } catch (error) {
    console.error('Error checking user in TiDB:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Type for social provider data
export interface SocialProviderData {
  id?: string;
  user_id: string;
  provider: string;
  provider_user_id?: string;
  provider_email?: string;
  provider_username?: string;
  provider_name?: string;
  provider_image?: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date;
}

// Save social provider data to TiDB
export const saveSocialProviderToTiDB = async (data: SocialProviderData) => {
  const pool = await createPool();
  try {
    console.log('Saving social provider data to TiDB:', data);
    const id = data.id || crypto.randomUUID();
    await pool.query(
      `INSERT INTO social_providers 
       (id, user_id, provider, provider_user_id, provider_email, provider_username, 
        provider_name, provider_image, access_token, refresh_token, token_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       provider_user_id = VALUES(provider_user_id),
       provider_email = VALUES(provider_email),
       provider_username = VALUES(provider_username),
       provider_name = VALUES(provider_name),
       provider_image = VALUES(provider_image),
       access_token = VALUES(access_token),
       refresh_token = VALUES(refresh_token),
       token_expires_at = VALUES(token_expires_at)`,
      [
        id, data.user_id, data.provider, data.provider_user_id, data.provider_email,
        data.provider_username, data.provider_name, data.provider_image,
        data.access_token, data.refresh_token, data.token_expires_at
      ]
    );
    console.log('Social provider data saved successfully');
    return id;
  } catch (error) {
    console.error('Error saving social provider data:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Close the connection pool
export const closePool = async () => {
  if (pool) {
    await pool.end();
    console.log('TiDB connection pool closed');
    pool = null; // Reset the pool
  }
};

// Initialize the pool and database schema
(async () => {
  try {
    await initializePool();
    await initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
})();

export { pool };