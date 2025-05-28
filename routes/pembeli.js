// routes/pembeli.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

// GET all pembeli
router.get('/', (req, res) => {
  db.all(`
    SELECT p.*, g.nama_group 
    FROM pembeli p 
    LEFT JOIN pembeli_group g ON p.id_group_pembeli = g.id_group_pembeli 
    ORDER BY p.id_pembeli DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST create pembeli
router.post('/', (req, res) => {
  const { pembeli_nama, pembeli_no_telp, pembeli_catatan, pembeli_status, id_group_pembeli } = req.body;
  if (!pembeli_nama || !pembeli_no_telp) {
    return res.status(400).json({ error: 'pembeli_nama dan pembeli_no_telp wajib diisi' });
  }
  db.run(
    `INSERT INTO pembeli (pembeli_nama, pembeli_no_telp, pembeli_catatan, pembeli_status, id_group_pembeli)
     VALUES (?, ?, ?, ?, ?)`,
    [pembeli_nama, pembeli_no_telp, pembeli_catatan || '', pembeli_status ?? 0, id_group_pembeli || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id_pembeli: this.lastID });
    }
  );
});

// PUT update pembeli
router.put('/:id', (req, res) => {
  const { pembeli_nama, pembeli_no_telp, pembeli_catatan, pembeli_status, id_group_pembeli } = req.body;
  db.run(
    `UPDATE pembeli SET pembeli_nama = ?, pembeli_no_telp = ?, pembeli_catatan = ?, pembeli_status = ?, id_group_pembeli = ? WHERE id_pembeli = ?`,
    [pembeli_nama, pembeli_no_telp, pembeli_catatan || '', pembeli_status ?? 0, id_group_pembeli || null, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// DELETE pembeli
router.delete('/:id', (req, res) => {
  db.run(`DELETE FROM pembeli WHERE id_pembeli = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
