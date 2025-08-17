require('dotenv').config();
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
   ssl: {
    rejectUnauthorized: true, // coba true dulu, kalau error ganti false
  },
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;
