// routes/auth.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

router.post('/login', (req, res) => {
  const { user_telp, user_password } = req.body;

  if (!user_telp || !user_password) {
    return res.status(400).json({ error: 'user_telp dan user_password wajib diisi.' });
  }

  db.get(
    `SELECT * FROM user WHERE user_telp = ? AND user_password = ?`,
    [user_telp, user_password],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: 'Login gagal. User tidak ditemukan.' });

      db.get(
        `SELECT * FROM shop WHERE id_toko = ?`,
        [user.id_toko],
        (err, shop) => {
          if (err) return res.status(500).json({ error: err.message });

          res.json({
            message: 'Login berhasil',
            user,
            shop
          });
        }
      );
    }
  );
});

module.exports = router;
