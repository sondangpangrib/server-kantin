// routes/produk.js
// npm install multer
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

const uploadDir = path.join(__dirname, '../uploads/produk');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, filename);
  }
});
const upload = multer({ storage });

// GET all produk
router.get('/', (req, res) => {
  db.all(`SELECT * FROM produk ORDER BY id_produk DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST create produk
router.post('/', upload.single('foto_produk'), (req, res) => {
  const { nama_produk, harga } = req.body;
  if (!nama_produk || harga == null) {
    return res.status(400).json({ error: 'nama_produk dan harga wajib diisi' });
  }
  const fotoPath = req.file ? `uploads/produk/${req.file.filename}` : '';
  db.run(
    `INSERT INTO produk (nama_produk, harga, foto_produk) VALUES (?, ?, ?)`,
    [nama_produk, harga, fotoPath],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id_produk: this.lastID });
    }
  );
});

// PUT update produk
router.put('/:id', upload.single('foto_produk'), (req, res) => {
  const { nama_produk, harga } = req.body;
  const fotoPath = req.file ? `uploads/produk/${req.file.filename}` : req.body.foto_produk || '';
  db.run(
    `UPDATE produk SET nama_produk = ?, harga = ?, foto_produk = ? WHERE id_produk = ?`,
    [nama_produk, harga, fotoPath, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// DELETE produk
router.delete('/:id', (req, res) => {
  db.get(`SELECT foto_produk FROM produk WHERE id_produk = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row && row.foto_produk && fs.existsSync(path.join(__dirname, '../', row.foto_produk))) {
      fs.unlinkSync(path.join(__dirname, '../', row.foto_produk));
    }
    db.run(`DELETE FROM produk WHERE id_produk = ?`, [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  });
});

module.exports = router;
