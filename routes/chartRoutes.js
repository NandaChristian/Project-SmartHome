const express = require('express');
const router = express.Router();
const db = require('../utils/db');

router.get('/chart', async (req, res) => {
  const { start, end } = req.query;

  try {
    const [rows] = await db.execute(`
      SELECT lokasi, status, waktu AS waktu, konsumsi_daya AS watt
      FROM logs
      WHERE waktu BETWEEN ? AND ?
      ORDER BY waktu ASC
    `, [start + ' 00:00:00', end + ' 23:59:59']);

    res.json(rows);
  } catch (error) {
    console.error('Gagal ambil chart data:', error);
    res.status(500).json({ message: 'Gagal ambil data grafik' });
  }
});


module.exports = router;

