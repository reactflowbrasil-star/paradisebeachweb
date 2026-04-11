const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "paradisebeack",
  password: process.env.DB_PASSWORD || "Alexandre2026@@",
  database: process.env.DB_NAME || "paradisebeack",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});

module.exports = { pool };
