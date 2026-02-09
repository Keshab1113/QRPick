const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  connectionLimit: 50,
  waitForConnections: true,
  queueLimit: 100,

  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 20000,

  dateStrings: true,
  timezone: "Z",

  multipleStatements: false,
  namedPlaceholders: false,
  charset: "utf8mb4",
});

module.exports = pool.promise(); // 🔑 THIS LINE FIXES EVERYTHING
