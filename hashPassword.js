const bcrypt = require('bcrypt');

const password = 'toki123'; // Ganti dengan password yang kamu inginkan
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  console.log('Hashed password:', hash);
});
