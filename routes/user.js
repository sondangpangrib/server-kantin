// routes/user.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

// GET all users
router.get('/', (req, res) => {
  db.all(`SELECT * FROM user`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST create new user
router.post('/', (req, res) => {
  const { user_nama, user_telp, user_password, id_toko, user_tipe } = req.body;
  if (!user_nama || !user_telp || !user_password) {
    return res.status(400).json({ error: 'Field wajib tidak lengkap' });
  }
  db.run(
    `INSERT INTO user (user_nama, user_telp, user_password, id_toko, user_tipe)
     VALUES (?, ?, ?, ?, ?)`,
    [user_nama, user_telp, user_password, id_toko ?? 0, user_tipe ?? 0],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id_user: this.lastID });
    }
  );
});

// PUT update user
router.put('/:id', (req, res) => {
  const { user_nama, user_telp, user_password, id_toko, user_tipe } = req.body;
  db.run(
    `UPDATE user SET user_nama = ?, user_telp = ?, user_password = ?, id_toko = ?, user_tipe = ? WHERE id_user = ?`,
    [user_nama, user_telp, user_password, id_toko ?? 0, user_tipe ?? 0, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// DELETE user
router.delete('/:id', (req, res) => {
  db.run(`DELETE FROM user WHERE id_user = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
