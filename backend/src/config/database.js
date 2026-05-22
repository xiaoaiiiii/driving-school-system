const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.168.2.135',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'driving_school',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00',
  connectTimeout: 30000,
  acquireTimeout: 30000,
  timeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
})

module.exports = pool
