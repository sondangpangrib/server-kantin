const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

function initDB() {
  const dbPath = path.join(__dirname, 'database.sqlite');
  console.log('📁 Membuat file di:', dbPath);
  console.log('📦 Membuat database SQLite dan inisialisasi tabel...');
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {

    db.run("PRAGMA foreign_keys = ON");

    db.run(`CREATE TABLE IF NOT EXISTS shop (
      id_toko INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_toko TEXT,
      alamat_toko TEXT,
      telp_wa_toko TEXT,
      status INTEGER DEFAULT 0
    )`, logError);

    db.run(`CREATE TABLE IF NOT EXISTS user_tipe_master (
      user_tipe INTEGER PRIMARY KEY,
      nama_tipe TEXT
    )`, logError);

    db.run(`CREATE TABLE IF NOT EXISTS user (
      id_user INTEGER PRIMARY KEY AUTOINCREMENT,
      user_nama TEXT,
      user_telp TEXT,
      user_password TEXT,
      foto_img_name TEXT,
      id_group_user INTEGER,
      id_toko INTEGER,
      user_tipe INTEGER,
      status INTEGER DEFAULT 0,
      FOREIGN KEY (user_tipe) REFERENCES user_tipe_master(user_tipe),
      FOREIGN KEY (id_toko) REFERENCES shop(id_toko)
    )`, logError);

    db.run(`CREATE TABLE IF NOT EXISTS produk (
      id_produk INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_produk TEXT,
      harga REAL,
      id_produk_kategori INTEGER,
      foto_produk TEXT,
      status INTEGER DEFAULT 0,
      FOREIGN KEY (id_produk_kategori) REFERENCES produk_kategori(id_produk_kategori)
    )`, logError);

    db.run(`CREATE TABLE IF NOT EXISTS produk_kategori (
      id_produk_kategori INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_produk_kategori TEXT,
      status INTEGER DEFAULT 0
    )`, logError);

    db.run(`CREATE TABLE IF NOT EXISTS user_group (
      id_group_user INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_group TEXT,
      user_tipe INTEGER,
      status INTEGER DEFAULT 0,
      FOREIGN KEY (user_tipe) REFERENCES user_tipe_master(user_tipe)
    )`, logError);

    db.run(`CREATE TABLE IF NOT EXISTS penjualan (
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
      FOREIGN KEY (id_pembeli) REFERENCES user(id_user),
      FOREIGN KEY (id_seles) REFERENCES user(id_user)
    )`, logError);

    db.run(`CREATE TABLE IF NOT EXISTS order_item (
      id_order_item INTEGER PRIMARY KEY AUTOINCREMENT,
      id_penjualan INTEGER,
      id_produk INTEGER,
      qty INTEGER,
      harga_jual REAL,
      FOREIGN KEY (id_penjualan) REFERENCES penjualan(id_penjualan),
      FOREIGN KEY (id_produk) REFERENCES produk(id_produk)
    )`, logError);

    db.run(`CREATE TABLE IF NOT EXISTS pengeluaran_kategori (
      idkategori_pengeluaran INTEGER PRIMARY KEY AUTOINCREMENT,
      pengeluaran_nama TEXT,
      status INTEGER DEFAULT 0
    )`, logError);

    db.run(`CREATE TABLE IF NOT EXISTS pengeluaran (
      id_pengeluaran INTEGER PRIMARY KEY AUTOINCREMENT,
      id_kategory_pengeluaran INTEGER,
      deskripsi_pengeluaran TEXT,
      total_pengeluaran REAL,
      foto_path TEXT,
      tanggal_pengeluaran TEXT,
      insert_date TEXT DEFAULT CURRENT_TIMESTAMP,
      update_date TEXT DEFAULT CURRENT_TIMESTAMP,
      status INTEGER DEFAULT 0,
      FOREIGN KEY (id_kategory_pengeluaran) REFERENCES pengeluaran_kategori(idkategori_pengeluaran)
    )`, logError);

    // Data awal
    db.run(`INSERT OR IGNORE INTO user_tipe_master (user_tipe, nama_tipe)
      VALUES (0, 'Superadmin')`, logError);
    db.run(`INSERT OR IGNORE INTO user_tipe_master (user_tipe, nama_tipe)
      VALUES (1, 'admin')`, logError);
    db.run(`INSERT OR IGNORE INTO user_tipe_master (user_tipe, nama_tipe)
      VALUES (2, 'kasir')`, logError);
    db.run(`INSERT OR IGNORE INTO user_tipe_master (user_tipe, nama_tipe)
      VALUES (3, 'Pembeli')`, logError);

    db.run(`INSERT OR IGNORE INTO user_group (id_group_user, nama_group, user_tipe, status)
      VALUES (0, 'Superadmin Group', 0, 0)`, logError);

    db.run(`INSERT OR IGNORE INTO shop (id_toko, nama_toko, alamat_toko, telp_wa_toko, status)
      VALUES (0, 'Kantin Neetas Suni', 'Jalan Ceger Raya', '6282124050350', 0)`, logError);

    db.run(`INSERT OR IGNORE INTO user (id_user, user_nama, user_telp, user_password, id_toko, user_tipe, status)
      VALUES (0, 'sondang', '6281316777619', '@Rahasiadong1215', 0, 0, 0)`, logError);

    db.run(`INSERT OR IGNORE INTO produk_kategori (id_produk_kategori, nama_produk_kategori, status)
      VALUES (0, 'Makanan', 0)`, logError);
    db.run(`INSERT OR IGNORE INTO produk_kategori (id_produk_kategori, nama_produk_kategori, status)
      VALUES (1, 'Minuman', 0)`, logError);
    db.run(`INSERT OR IGNORE INTO produk_kategori (id_produk_kategori, nama_produk_kategori, status)
      VALUES (2, 'Paket Catering Mingguan', 0)`, logError);
    db.run(`INSERT OR IGNORE INTO produk_kategori (id_produk_kategori, nama_produk_kategori, status)
      VALUES (3, 'Paket Catering Bulanan', 0)`, logError);

    console.log('✅ Database berhasil dibuat dan data awal disisipkan.');
  });

  setTimeout(() => db.close(), 500);
}

function logError(err) {
  if (err) {
    console.error('❌ SQL error:', err.message);
  }
}

module.exports = initDB;
