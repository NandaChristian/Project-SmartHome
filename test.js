require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('✅ MySQL Connected!');
    const [rows] = await connection.query('SELECT NOW() AS time');
    console.log(rows);
    await connection.end();
  } catch (err) {
    console.error('❌ MySQL Connection Failed:', err);
  }
})();
