import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8700', 10),
  db: {
    type: process.env.DB_TYPE || 'sqlite',
    path: process.env.DB_PATH || './data/idapp.db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'idapp',
  },
  aesSecret: process.env.AES_SECRET || 'idapp_aes_secret_key_2024',
  jwt: {
    secret: process.env.JWT_SECRET || 'idapp_jwt_secret_key_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  admin: {
    username: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASS || 'admin123',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
  },
};