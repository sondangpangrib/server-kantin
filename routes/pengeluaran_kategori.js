// routes/pengeluaran.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

// GET all pengeluaran (optional filter by date)
router.get('/', (req, res) => {
  const { start, end } = req.query;
  let query = `SELECT p.*, k.pengeluaran_nama FROM pengeluaran p LEFT JOIN pengeluaran_kategori k ON p.id_kategory_pengeluaran = k.idkategori_pengeluaran ORDER BY tanggal_pengeluaran DESC`;
  const params = [];

  if (start && end) {
    query = `SELECT p.*, k.pengeluaran_nama FROM pengeluaran p LEFT JOIN pengeluaran_kategori k ON p.id_kategory_pengeluaran = k.idkategori_pengeluaran WHERE date(tanggal_pengeluaran) BETWEEN ? AND ? ORDER BY tanggal_pengeluaran DESC`;
    params.push(start, end);
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST create pengeluaran
router.post('/', (req, res) => {
  const { id_kategory_pengeluaran, deskripsi_pengeluaran, total_pengeluaran, foto_path, tanggal_pengeluaran } = req.body;
  if (!id_kategory_pengeluaran || !tanggal_pengeluaran) {
    return res.status(400).json({ error: 'id_kategory_pengeluaran dan tanggal_pengeluaran wajib diisi' });
  }
  db.run(
    `INSERT INTO pengeluaran (
      id_kategory_pengeluaran, deskripsi_pengeluaran, total_pengeluaran, foto_path,
      tanggal_pengeluaran, insert_date, update_date
    ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [id_kategory_pengeluaran, deskripsi_pengeluaran || '', total_pengeluaran || 0, foto_path || '', tanggal_pengeluaran],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id_pengeluaran: this.lastID });
    }
  );
});

// Kategori pengeluaran
router.get('/kategori', (req, res) => {
  db.all(`SELECT * FROM pengeluaran_kategori ORDER BY idkategori_pengeluaran DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/kategori', (req, res) => {
  const { pengeluaran_nama } = req.body;
  if (!pengeluaran_nama) return res.status(400).json({ error: 'Nama kategori wajib diisi' });

  db.run(`INSERT INTO pengeluaran_kategori (pengeluaran_nama) VALUES (?)`, [pengeluaran_nama], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ idkategori_pengeluaran: this.lastID });
  });
});

module.exports = router;
