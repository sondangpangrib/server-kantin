// routes/pembeli_group.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

// GET all pembeli_group
router.get('/', (req, res) => {
  db.all(`SELECT * FROM pembeli_group ORDER BY id_group_pembeli DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST create pembeli_group
router.post('/', (req, res) => {
  const { nama_group } = req.body;
  if (!nama_group) return res.status(400).json({ error: 'nama_group wajib diisi' });

  db.run(`INSERT INTO pembeli_group (nama_group) VALUES (?)`, [nama_group], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id_group_pembeli: this.lastID });
  });
});

// PUT update pembeli_group
router.put('/:id', (req, res) => {
  const { nama_group } = req.body;
  db.run(`UPDATE pembeli_group SET nama_group = ? WHERE id_group_pembeli = ?`, [nama_group, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

// DELETE pembeli_group
router.delete('/:id', (req, res) => {
  db.run(`DELETE FROM pembeli_group WHERE id_group_pembeli = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
