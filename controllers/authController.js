const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const db = require('../utils/db');

const JWT_SECRET = process.env.JWT_SECRET;


// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.time('Login');

    // cek apakah email sama dengan data yg ada di database
    const [results] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (results.length === 0) {
      console.timeEnd('Login');
      return res.status(401).json({ message: 'Email tidak ditemukan' });
    }

    // mengecek password apakah sama dengan yg di hash di database
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.timeEnd('Login');
      return res.status(401).json({ message: 'Password salah' });
    }

    // pembuatan token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });

    console.timeEnd('Login');
    res.json({ message: 'Login berhasil', token
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan saat login' });
  }
};

