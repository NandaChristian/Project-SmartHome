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

// // POST log baru (diperlukan untuk menyimpan log dari WebSocket)
// router.post('/add', async (req, res) => {
//   const { lokasi, status, time, watt } = req.body;
//   const waktuWIB = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' });

//   console.log("Waktu lokal WIB yang dikirim ke DB:", waktuWIB);

//   console.log('Request POST /api/logs/add:', { lokasi, status, time, watt });

//   try {
//     await db.query(
//       'INSERT INTO logs (lokasi, status, waktu, konsumsi_daya) VALUES (?, ?, ?, ?)',
//       [lokasi, status, waktuWIB, watt]
//     );
//     console.log('Log berhasil disimpan ke database');
//     res.status(200).json({ message: 'Log berhasil disimpan' });
//   } catch (err) {
//     console.error('Gagal simpan log:', err);
//     res.status(500).json({ message: 'Gagal simpan log' });
//   }
// });



module.exports = router;