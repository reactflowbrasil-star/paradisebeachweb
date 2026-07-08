import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "paradisebeach.com.br",
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "paradkbs_lp",
  user: process.env.DB_USER || "paradkbs_lp",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  timezone: "Z",
});

export async function query(sql, params = {}) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

