const express = require('express');
const router = express.Router();
const db = require('../utils/db');

// Endpoint: GET /api/logs/all - Ambil semua log dari database
router.get('/all', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM logs ORDER BY waktu DESC');
    res.json(rows);
  } catch (error) {
    console.error('Gagal ambil semua log:', error);
    res.status(500).json({ message: 'Gagal mengambil data log' });
  }
});



module.exports = router;