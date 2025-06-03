const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');

const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

// Folder upload (uploads/)
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Konfigurasi multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, filename);
  }
});
const upload = multer({ storage });

// GET semua pengeluaran dengan filter
router.get('/', (req, res) => {
  const { dari, sampai, kategori } = req.query;
  console.log("okayy");
  let query = `
    SELECT p.*, k.pengeluaran_nama 
    FROM pengeluaran p
    LEFT JOIN pengeluaran_kategori k ON p.id_kategory_pengeluaran = k.idkategori_pengeluaran
    WHERE p.status = 0
  `;
  const params = [];

  if (dari && sampai) {
    query += ` AND DATE(p.tanggal_pengeluaran) BETWEEN DATE(?) AND DATE(?)`;
    params.push(dari, sampai);
  }

  if (kategori) {
    query += ` AND p.id_kategory_pengeluaran = ?`;
    params.push(kategori);
  }

  query += ` ORDER BY p.tanggal_pengeluaran DESC`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST tambah pengeluaran
router.post('/', upload.single('foto'), (req, res) => {
  const {
    id_kategory_pengeluaran,
    deskripsi_pengeluaran,
    total_pengeluaran,
    tanggal_pengeluaran
  } = req.body;
  const foto_filename = req.file ? req.file.filename : null;

  db.run(`
    INSERT INTO pengeluaran 
    (id_kategory_pengeluaran, deskripsi_pengeluaran, total_pengeluaran, foto_path, tanggal_pengeluaran) 
    VALUES (?, ?, ?, ?, ?)
  `, [id_kategory_pengeluaran, deskripsi_pengeluaran, total_pengeluaran, foto_filename, tanggal_pengeluaran], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// PUT update pengeluaran
router.put('/:id', upload.single('foto'), (req, res) => {
  const { id } = req.params;
  const {
    id_kategory_pengeluaran,
    deskripsi_pengeluaran,
    total_pengeluaran,
    tanggal_pengeluaran
  } = req.body;
  const foto_filename = req.file ? req.file.filename : null;

  // Ambil foto lama jika tidak upload baru
  if (!foto_filename) {
    db.get(`SELECT foto_path FROM pengeluaran WHERE id_pengeluaran = ?`, [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      updatePengeluaran(row.foto_path);
    });
  } else {
    updatePengeluaran(foto_filename);
  }

  function updatePengeluaran(foto) {
    db.run(`
      UPDATE pengeluaran SET
        id_kategory_pengeluaran = ?,
        deskripsi_pengeluaran = ?,
        total_pengeluaran = ?,
        foto_path = ?,
        tanggal_pengeluaran = ?,
        update_date = CURRENT_TIMESTAMP
      WHERE id_pengeluaran = ?
    `, [id_kategory_pengeluaran, deskripsi_pengeluaran, total_pengeluaran, foto, tanggal_pengeluaran, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    });
  }
});

// GET kategori
router.get('/kategori', (req, res) => {
  db.all(`SELECT * FROM pengeluaran_kategori WHERE status = 0 ORDER BY pengeluaran_nama ASC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
