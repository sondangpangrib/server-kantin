const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

// GET all kategori
router.get('/', (req, res) => {
  db.all(`SELECT * FROM produk_kategori ORDER BY id_produk_kategori DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET kategori by ID
router.get('/:id', (req, res) => {
  db.get(`SELECT * FROM produk_kategori WHERE id_produk_kategori = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    res.json(row);
  });
});

// POST create kategori
router.post('/', (req, res) => {
  const { nama_produk_kategori } = req.body;
  if (!nama_produk_kategori) {
    return res.status(400).json({ error: 'nama_produk_kategori wajib diisi' });
  }

  db.run(`INSERT INTO produk_kategori (nama_produk_kategori) VALUES (?)`, [nama_produk_kategori], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id_produk_kategori: this.lastID });
  });
});

// PUT update kategori
router.put('/:id', (req, res) => {
  const { nama_produk_kategori } = req.body;
  if (!nama_produk_kategori) {
    return res.status(400).json({ error: 'nama_produk_kategori wajib diisi' });
  }

  db.run(`UPDATE produk_kategori SET nama_produk_kategori = ? WHERE id_produk_kategori = ?`,
    [nama_produk_kategori, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    });
});

// DELETE kategori
router.delete('/:id', (req, res) => {
  db.run(`DELETE FROM produk_kategori WHERE id_produk_kategori = ?`, [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
