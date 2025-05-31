const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');

const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

const uploadDir = path.join(__dirname, '../uploads/foto');
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

// GET all users (kecuali user_tipe = 3), JOIN nama_group
router.get('/', (req, res) => {
  db.all(`
    SELECT 
      u.*, 
      g.nama_group 
    FROM user u
    LEFT JOIN user_group g ON u.id_group_user = g.id_group_user
    WHERE u.user_tipe != 3
    ORDER BY u.id_user DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST create user (support foto + group)
router.post('/', upload.single('foto'), (req, res) => {
  const { user_nama, user_telp, user_password, id_toko, user_tipe, id_group_user } = req.body;
  const foto_img_name = req.file ? `uploads/foto/${req.file.filename}` : '';

  if (!user_nama || !user_telp || !user_password) {
    return res.status(400).json({ error: 'Field wajib tidak lengkap' });
  }

  db.run(
    `INSERT INTO user (user_nama, user_telp, user_password, foto_img_name, id_toko, user_tipe, id_group_user)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user_nama, user_telp, user_password, foto_img_name, id_toko ?? 0, user_tipe ?? 0, id_group_user || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id_user: this.lastID });
    }
  );
});

// PUT update user (support foto + group)
router.put('/:id', upload.single('foto'), (req, res) => {
  const { user_nama, user_telp, user_password, id_toko, user_tipe, id_group_user } = req.body;
  const foto_img_name = req.file ? `uploads/foto/${req.file.filename}` : req.body.foto_img_name || '';

  if (req.file) {
    db.get(`SELECT foto_img_name FROM user WHERE id_user = ?`, [req.params.id], (err, row) => {
      if (!err && row && row.foto_img_name && fs.existsSync(path.join(__dirname, '../', row.foto_img_name))) {
        fs.unlinkSync(path.join(__dirname, '../', row.foto_img_name));
      }
    });
  }

  db.run(
    `UPDATE user 
     SET user_nama = ?, user_telp = ?, user_password = ?, foto_img_name = ?, id_toko = ?, user_tipe = ?, id_group_user = ?
     WHERE id_user = ?`,
    [user_nama, user_telp, user_password, foto_img_name, id_toko ?? 0, user_tipe ?? 0, id_group_user || null, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// DELETE user
router.delete('/:id', (req, res) => {
  db.get(`SELECT foto_img_name FROM user WHERE id_user = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row && row.foto_img_name && fs.existsSync(path.join(__dirname, '../', row.foto_img_name))) {
      fs.unlinkSync(path.join(__dirname, '../', row.foto_img_name));
    }

    db.run(`DELETE FROM user WHERE id_user = ?`, [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  });
});

module.exports = router;
