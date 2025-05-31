const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, 'database.sqlite');
function initDB(dbPath) {
  console.log('📦 Membuat database SQLite dan inisialisasi tabel...');
  const db = new sqlite3.Database(dbPath);
  db.serialize(() => {

    db.run("PRAGMA foreign_keys = ON");

    db.run(`CREATE TABLE IF NOT EXISTS shop (
      id_toko INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_toko TEXT,
      alamat_toko TEXT,
      telp_wa_toko TEXT
    )`, logError);

    db.run(`CREATE TABLE IF NOT EXISTS user (
      id_user INTEGER PRIMARY KEY AUTOINCREMENT,
      user_nama TEXT,
      user_telp TEXT,
      user_password TEXT,
      foto_img_name TEXT,
      id_group_user NTEGER,
      id_toko INTEGER,
      user_tipe INTEGER DEFAULT 0,
      FOREIGN KEY (id_toko) REFERENCES shop(id_toko)
    )`, logError);

    db.run(`CREATE TABLE IF NOT EXISTS produk (
      id_produk INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_produk TEXT,
      harga REAL,
      id_produk_kategori INTEGER,
      foto_produk TEXT
    )`, logError);

      db.run(`CREATE TABLE IF NOT EXISTS produk_kategori (
      id_produk_kategori INTEGER PRIMARY KEY AUTOINCREMENT,
      nama_produk_kategori TEXT
    )`, logError);

    db.run(`CREATE TABLE IF NOT EXISTS user_group (
      id_group_user INTEGER PRIMARY KEY AUTOINCREMENT,
      user_tipe INTEGER,
      nama_group TEXT
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
      FOREIGN KEY (id_pembeli) REFERENCES pembeli(id_pembeli),
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
      pengeluaran_nama TEXT
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
      FOREIGN KEY (id_kategory_pengeluaran) REFERENCES pengeluaran_kategori(idkategori_pengeluaran)
    )`, logError);

    // Data awal
    db.run(`INSERT OR IGNORE INTO shop (id_toko, nama_toko, alamat_toko, telp_wa_toko)
      VALUES (0, 'Kantin Neetas Suni', 'Jalan Ceger Raya', '6282124050350')`, logError);

    db.run(`INSERT OR IGNORE INTO user (id_user, user_nama, user_telp, user_password, id_toko, user_tipe)
      VALUES (0, 'sondang', '6281316777619', '@Rahasiadong1215', 0, 1)`, logError);

    db.run(`INSERT OR IGNORE INTO produk_kategori (id_produk_kategori, nama_produk_kategori)
      VALUES (0, 'Makanan' )`, logError);

    db.run(`INSERT OR IGNORE INTO produk_kategori (id_produk_kategori, nama_produk_kategori)
      VALUES (1, 'Minuman' )`, logError);  

    db.run(`INSERT OR IGNORE INTO produk_kategori (id_produk_kategori, nama_produk_kategori)
      VALUES (2, 'Paket Catering Mingguan')`, logError);  

    db.run(`INSERT OR IGNORE INTO produk_kategori (id_produk_kategori, nama_produk_kategori)
      VALUES (3, 'Paket Catering Bulanan')`, logError);     

    ensureColumn(db, 'user', 'id_group_user', 'INTEGER');
    ensureColumn(db, 'user_group', 'user_tipe', 'INTEGER');
    ensureColumn(db, 'produk', 'id_produk_kategori', 'INTEGER');

    console.log('✅ Database berhasil dibuat dan data awal disisipkan.');
  });

  setTimeout(() => db.close(), 500); // atau 1000 ms untuk amannya. 
}
function ensureColumn(db, tableName, columnName, columnDef) {
  db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
    if (err) {
      console.error(`❌ Gagal mengambil info tabel ${tableName}:`, err.message);
      return;
    }
    const columnExists = columns.some(col => col.name === columnName);
    if (!columnExists) {
      const sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`;
      db.run(sql, logError);
      console.log(`🆕 Kolom '${columnName}' ditambahkan ke tabel '${tableName}'`);
    }
  });
}
function logError(err) {
  if (err) {
    console.error('❌ SQL error:', err.message);
  }
}
module.exports = initDB;  