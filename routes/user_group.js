const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

// GET semua user group
router.get('/', (req, res) => {
  db.all(`SELECT * FROM user_group ORDER BY id_group_user DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET hanya untuk dropdown (kecuali user_tipe = 3)
router.get('/dropdown', (req, res) => {
  db.all(`SELECT id_group_user, nama_group FROM user_group WHERE user_tipe != 3 ORDER BY nama_group ASC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST buat user group baru
router.post('/', (req, res) => {
  const { user_tipe, nama_group } = req.body;
  if (!nama_group || user_tipe == null) {
    return res.status(400).json({ error: 'user_tipe dan nama_group wajib diisi' });
  }
  db.run(
    `INSERT INTO user_group (user_tipe, nama_group) VALUES (?, ?)`,
    [user_tipe, nama_group],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id_group_user: this.lastID });
    }
  );
});
router.get('/pembeli', (req, res) => {
  db.all(`SELECT * FROM user_group WHERE user_tipe = 3 ORDER BY id_group_user DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
// GET user_group untuk user lain (user_tipe != 3)
router.get('/user', (req, res) => {
  db.all(`SELECT * FROM user_group WHERE user_tipe != 3 ORDER BY id_group_user DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
// PUT update user group
router.put('/:id', (req, res) => {
  const { user_tipe, nama_group } = req.body;
  db.run(
    `UPDATE user_group SET user_tipe = ?, nama_group = ? WHERE id_group_user = ?`,
    [user_tipe, nama_group, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// DELETE user group
router.delete('/:id', (req, res) => {
  db.run(`DELETE FROM user_group WHERE id_group_user = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
