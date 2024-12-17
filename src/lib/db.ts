import mysql, { OkPacket } from 'mysql2/promise';

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  port: parseInt(process.env.TIDB_PORT || '4000'),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  }
});

export interface UserData {
  [key: string]: string | undefined;
  id?: string;
  email: string;
  username: string;
  password?: string;
  provider?: string;
  image?: string;
  createdAt?: string;
  lastLogin?: string;
}

export async function saveUserToTiDB(userData: UserData): Promise<string> {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      'INSERT INTO users (email, username, password, provider, image, created_at, last_login) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [userData.email, userData.username, userData.password, userData.provider, userData.image]
    ) as [OkPacket, mysql.FieldPacket[]];
    
    const insertId = result.insertId;
    return `user:${insertId}`;
  } finally {
    connection.release();
  }
}

export async function getUserFromTiDB(userId: string): Promise<UserData | null> {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId.replace('user:', '')]
    );
    
    if (Array.isArray(rows) && rows.length > 0) {
      const user = rows[0] as UserData;
      return user;
    }
    return null;
  } finally {
    connection.release();
  }
}

export { pool };
