// db_init.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'database.sqlite');

// Cek apakah file sudah ada
if (!fs.existsSync(dbPath)) {
  console.log('📦 Membuat database SQLite dan inisialisasi tabel...');

  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    // Schema
    db.run(`CREATE TABLE shop (
      id_toko INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_toko TEXT,
      alamat_toko TEXT,
      telp_wa_toko TEXT
    )`);

    db.run(`CREATE TABLE user (
      id_user INTEGER PRIMARY KEY AUTOINCREMENT,
      user_nama TEXT,
      user_telp TEXT,
      user_password TEXT,
      id_toko INTEGER,
      user_tipe INTEGER DEFAULT 0,
      FOREIGN KEY (id_toko) REFERENCES shop(id_toko)
    )`);

    db.run(`CREATE TABLE produk (
      id_produk INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_produk TEXT,
      harga REAL,
      foto_produk TEXT
    )`);

    db.run(`CREATE TABLE pembeli_group (
      id_group_pembeli INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_group TEXT
    )`);

    db.run(`CREATE TABLE pembeli (
      id_pembeli INTEGER PRIMARY KEY AUTOINCREMENT,
      pembeli_nama TEXT,
      pembeli_no_telp TEXT,
      pembeli_catatan TEXT,
      pembeli_status INTEGER DEFAULT 0,
      id_group_pembeli INTEGER,
      FOREIGN KEY (id_group_pembeli) REFERENCES pembeli_group(id_group_pembeli)
    )`);

    db.run(`CREATE TABLE penjualan (
      id_penjualan INTEGER PRIMARY KEY AUTOINCREMENT,
      id_transaksi TEXT UNIQUE,
      tanggal_transaksi TEXT DEFAULT CURRENT_TIMESTAMP,
      tanggal_update TEXT DEFAULT CURRENT_TIMESTAMP,
      id_pembeli INTEGER,
      id_seles INTEGER,
      nama_pembeli TEXT,
      metode_pembayaran INTEGER DEFAULT 2,
      diskon REAL DEFAULT 0,
      total_transaksi REAL DEFAULT 0,
      status_transaksi INTEGER DEFAULT 0,
      FOREIGN KEY (id_pembeli) REFERENCES pembeli(id_pembeli),
      FOREIGN KEY (id_seles) REFERENCES user(id_user)
    )`);

    db.run(`CREATE TABLE order_item (
      id_order_item INTEGER PRIMARY KEY AUTOINCREMENT,
      id_penjualan INTEGER,
      id_produk INTEGER,
      qty INTEGER,
      harga_jual REAL,
      FOREIGN KEY (id_penjualan) REFERENCES penjualan(id_penjualan),
      FOREIGN KEY (id_produk) REFERENCES produk(id_produk)
    )`);

    db.run(`CREATE TABLE pengeluaran_kategori (
      idkategori_pengeluaran INTEGER PRIMARY KEY AUTOINCREMENT,
      pengeluaran_nama TEXT
    )`);

    db.run(`CREATE TABLE pengeluaran (
      id_pengeluaran INTEGER PRIMARY KEY AUTOINCREMENT,
      id_kategory_pengeluaran INTEGER,
      deskripsi_pengeluaran TEXT,
      total_pengeluaran REAL,
      foto_path TEXT,
      tanggal_pengeluaran TEXT,
      insert_date TEXT DEFAULT CURRENT_TIMESTAMP,
      update_date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_kategory_pengeluaran) REFERENCES pengeluaran_kategori(idkategori_pengeluaran)
    )`);

    // Data awal
    db.run(`INSERT INTO shop (id_toko, nama_toko, alamat_toko, telp_wa_toko)
      VALUES (0, 'Kantin Neetas Suni', 'Jalan Ceger Raya', '6282124050350')`);

    db.run(`INSERT INTO user (id_user, user_nama, user_telp, user_password, id_toko, user_tipe)
      VALUES (0, 'sondang', '6281316777619', '@Rahasiadong1215', 0, 1)`);

    console.log('✅ Database berhasil dibuat dan data awal disisipkan.');
  });

  db.close();
} else {
  console.log('✅ Database sudah ada. Tidak perlu inisialisasi ulang.');
}
