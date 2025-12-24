import dotenv from "dotenv";
import pkg from "pg";

dotenv.config({ path: new URL('../.env', import.meta.url) }); // 🔴 FORCE LOAD

const { Pool } = pkg;

console.log('DB CONFIG:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  db: process.env.DB_NAME
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

export default pool;
