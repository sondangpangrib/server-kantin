const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');

const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));

const uploadDir = path.join(__dirname, '../uploads');
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

// GET all pembeli (user_tipe = 3) + nama_group dari user_group
router.get('/', (req, res) => {
  db.all(`
    SELECT 
      u.id_user AS id_pembeli, 
      u.user_nama AS pembeli_nama, 
      u.user_telp AS pembeli_no_telp,
      u.foto_img_name,
      u.id_toko,
      u.id_group_user,
      g.nama_group
    FROM user u
    LEFT JOIN user_group g ON u.id_group_user = g.id_group_user
    WHERE u.user_tipe = 3
    ORDER BY u.id_user DESC
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST create pembeli
router.post('/', upload.single('foto'), (req, res) => {
  const { user_nama, user_telp, user_password, id_toko, id_group_user } = req.body;
  if (!user_nama || !user_telp || !user_password) {
    return res.status(400).json({ error: 'user_nama, user_telp, dan user_password wajib diisi' });
  }

  const foto_img_name = req.file ? `${req.file.filename}` : '';

  db.run(
    `INSERT INTO user (user_nama, user_telp, user_password, foto_img_name, id_toko, user_tipe, id_group_user)
     VALUES (?, ?, ?, ?, ?, 3, ?)`,
    [user_nama, user_telp, user_password, foto_img_name, id_toko || 0, id_group_user || null],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id_pembeli: this.lastID });
    }
  );
});

// PUT update pembeli
router.put('/:id', upload.single('foto'), (req, res) => {
  const { user_nama, user_telp, user_password, id_toko, id_group_user } = req.body;
  const foto_img_name = req.file ? `${req.file.filename}` : req.body.foto_img_name || '';

  db.run(
    `UPDATE user 
     SET user_nama = ?, user_telp = ?, user_password = ?, foto_img_name = ?, id_toko = ?, id_group_user = ?
     WHERE id_user = ? AND user_tipe = 3`,
    [user_nama, user_telp, user_password, foto_img_name, id_toko || 0, id_group_user || null, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// DELETE pembeli
router.delete('/:id', (req, res) => {
  db.get(`SELECT foto_img_name FROM user WHERE id_user = ? AND user_tipe = 3`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row && row.foto_img_name && fs.existsSync(path.join(__dirname, '../', row.foto_img_name))) {
      fs.unlinkSync(path.join(__dirname, '../', row.foto_img_name));
    }

    db.run(`DELETE FROM user WHERE id_user = ? AND user_tipe = 3`, [req.params.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    });
  });
});

module.exports = router;
