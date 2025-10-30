// db.js
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "sql8.freesqldatabase.com",  // Cloud MySQL host
  user: "sql8805239",                // Login user
  password: "HYxbVbHZu5",    // ⚠️ Replace with your actual password
  database: "sql8805239",            // Usually same as user for FreeSQLDatabase
  port: 3306,                        // Default MySQL port
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false                         // No SSL (as per your details)
});

export default pool;