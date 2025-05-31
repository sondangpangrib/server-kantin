// routes/penjualan.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const Excel = require('exceljs');
const PDFDocument = require('pdfkit');
const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'));
const { v4: uuidv4 } = require('uuid');
   
router.get('/list/export/pdf', (req, res) => {
  const { start, end } = req.query;
  const startDate = start || new Date().toISOString().split('T')[0];
  const endDate = end || new Date().toISOString().split('T')[0];
  const from = `${startDate} 00:00:00`;
  const to = `${endDate} 23:59:59`;

  const query = `SELECT * FROM penjualan WHERE datetime(tanggal_transaksi) BETWEEN ? AND ? ORDER BY tanggal_transaksi DESC`;

  db.all(query, [from, to], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const filePath = path.join(__dirname, '../exports/laporan_penjualan.pdf');
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(16).text('Laporan Penjualan', { align: 'center' });
    doc.moveDown();

    let total = 0;
    let totalSetelahDiskon = 0;

    rows.forEach((row, i) => {
      const diskon = row.diskon || 0;
      const after = row.total_transaksi * (1 - diskon / 100);
      total += row.total_transaksi;
      totalSetelahDiskon += after;
      doc.fontSize(10).text(`${i + 1}. ${row.tanggal_transaksi} | ${row.nama_pembeli} | Rp ${row.total_transaksi.toFixed(0)} | Diskon: ${diskon}% | Net: Rp ${after.toFixed(0)}`);
    });

    doc.moveDown();
    doc.text(`Total: Rp ${total.toFixed(0)}`);
    doc.text(`Total Setelah Diskon: Rp ${totalSetelahDiskon.toFixed(0)}`);

    doc.end();
    stream.on('finish', () => {
      res.download(filePath);
    });
  });
});

router.get('/tanggal-hari-ini', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  res.json({ tanggal: today });
});

router.get('/list/export/excel', (req, res) => {
  const { start, end } = req.query;
  const startDate = start || new Date().toISOString().split('T')[0];
  const endDate = end || new Date().toISOString().split('T')[0];
  const from = `${startDate} 00:00:00`;
  const to = `${endDate} 23:59:59`;

  const query = `SELECT * FROM penjualan WHERE datetime(tanggal_transaksi) BETWEEN ? AND ? ORDER BY tanggal_transaksi DESC`;

  db.all(query, [from, to], async (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet('Penjualan');

    sheet.columns = [
      { header: 'Tanggal', key: 'tanggal', width: 20 },
      { header: 'Nama Pembeli', key: 'nama', width: 25 },
      { header: 'Total Transaksi', key: 'total', width: 15 },
      { header: 'Diskon (%)', key: 'diskon', width: 12 },
      { header: 'Setelah Diskon', key: 'net', width: 18 }
    ];

    let total = 0;
    let totalNet = 0;

    rows.forEach(row => {
      const after = row.total_transaksi * (1 - (row.diskon || 0) / 100);
      total += row.total_transaksi;
      totalNet += after;
      sheet.addRow({
        tanggal: row.tanggal_transaksi,
        nama: row.nama_pembeli,
        total: row.total_transaksi,
        diskon: row.diskon,
        net: after
      });
    });

    sheet.addRow([]);
    sheet.addRow({ tanggal: 'Total', total: total, net: totalNet });

    const filePath = path.join(__dirname, '../exports/laporan_penjualan.xlsx');
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath);
  });
});

router.post('/simpan', (req, res) => {
 const { id_seles,id_pembeli, nama_pembeli, metode_pembayaran, diskon, total_transaksi, status_transaksi, items, id_transaksi } = req.body;

   console.log("Received payload:", req.body); 
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order tidak boleh kosong!' });
  }
  if (metode_pembayaran == 4 && !id_pembeli) {
    return res.status(400).json({ error: 'Pembayaran hutang harus pilih pembeli!' });
  }
  const finalIdTransaksi = id_transaksi || uuidv4();

  db.serialize(() => {
    const query = `INSERT OR REPLACE INTO penjualan (
      id_seles, id_transaksi, id_pembeli, nama_pembeli, metode_pembayaran, diskon, total_transaksi, status_transaksi, tanggal_update
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
      
    db.run(query, [
      id_seles||null,
      finalIdTransaksi,
      id_pembeli || null,
      nama_pembeli || '',
      metode_pembayaran,
      diskon,
      total_transaksi,
      status_transaksi
    ], function (err) {
      if (err) return res.status(500).json({ error: err.message });

      db.get('SELECT id_penjualan FROM penjualan WHERE id_transaksi = ?', [finalIdTransaksi], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });

        const id_penjualan = row.id_penjualan;
        db.run('DELETE FROM order_item WHERE id_penjualan = ?', [id_penjualan], (delErr) => {
          if (delErr) return res.status(500).json({ error: delErr.message });

          const stmt = db.prepare('INSERT INTO order_item (id_penjualan, id_produk, qty, harga_jual) VALUES (?, ?, ?, ?)');
                  items.forEach(item => {
            stmt.run(id_penjualan, item.id_produk, item.qty, item.harga_jual);
          });
          stmt.finalize();
          res.json({ success: true, id_penjualan });
        });
      });
    });
  });
});

// GET /list - Ambil daftar penjualan (dengan search dan filter tanggal)
router.get('/list', (req, res) => {
  const { search = '', dari, sampai } = req.query;

  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('(nama_pembeli LIKE ? OR id_transaksi LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (dari && sampai) {
    conditions.push('DATE(tanggal_transaksi) BETWEEN DATE(?) AND DATE(?)');
    params.push(dari, sampai);
  } else {
    // default: hari ini
    conditions.push('DATE(tanggal_transaksi) = DATE("now", "localtime")');
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  const query = `
    SELECT p.*, u.user_nama AS nama_seles
    FROM penjualan p
    LEFT JOIN user u ON p.id_seles = u.id_user
    ${whereClause}
    ORDER BY tanggal_transaksi DESC
  `;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.get('/detail', (req, res) => {
  const { id_penjualan } = req.query;
  if (!id_penjualan) return res.status(400).json({ error: 'ID penjualan dibutuhkan' });

  const transaksiQuery = `
    SELECT p.*, u.user_nama AS nama_seles
    FROM penjualan p
    LEFT JOIN user u ON u.id_user = p.id_seles
    WHERE p.id_penjualan = ?
  `;

  const itemsQuery = `
    SELECT o.*, pr.nama_produk, pr.foto_produk AS foto
    FROM order_item o
    LEFT JOIN produk pr ON pr.id_produk = o.id_produk
    WHERE o.id_penjualan = ?
  `;

  db.get(transaksiQuery, [id_penjualan], (err, transaksi) => {
    if (err) {
      console.error('❌ Query transaksi error:', err.message);
      return res.status(500).json({ error: err.message });
    }

    if (!transaksi) {
      console.warn('⚠️ Transaksi tidak ditemukan:', id_penjualan);
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }

    db.all(itemsQuery, [id_penjualan], (err2, items) => {
      if (err2) {
        console.error('❌ Query items error:', err2.message);
        return res.status(500).json({ error: err2.message });
      }

      res.json({ transaksi, items });
    });
  });
});

router.get('/nota/pdf', (req, res) => {
  const { id_penjualan } = req.query;
  if (!id_penjualan) return res.status(400).json({ error: 'ID transaksi dibutuhkan' });

  const transaksiQuery = `
    SELECT p.*, u.user_nama AS nama_seles
    FROM penjualan p
    LEFT JOIN user u ON u.id_user = p.id_seles
    WHERE p.id_penjualan = ?
  `;

  const itemsQuery = `
    SELECT o.*, pr.nama_produk, pr.foto_img_name AS foto
    FROM order_item o
    LEFT JOIN produk pr ON pr.id_produk = o.id_produk
    WHERE o.id_penjualan = ?
  `;

  db.get(transaksiQuery, [id_penjualan], (err, trx) => {
    if (err || !trx) return res.status(500).json({ error: err?.message || 'Transaksi tidak ditemukan' });

    db.all(itemsQuery, [trx.id_penjualan], (err2, items) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const doc = new PDFDocument({ margin: 40 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=nota_${id_penjualan}.pdf`);
      doc.pipe(res);

      doc.fontSize(16).text('NOTA PENJUALAN', { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(10);
      doc.text(`ID Transaksi: ${trx.id_transaksi}`);
      doc.text(`Tanggal: ${trx.tanggal_transaksi}`);
      doc.text(`Pembeli: ${trx.nama_pembeli || '-'}`);
      doc.text(`Kasir: ${trx.nama_seles || '-'}`);
      doc.text(`Metode: ${trx.metode_pembayaran}`);
      doc.text(`Status: ${trx.status_transaksi}`);
      doc.moveDown();

      doc.font('Helvetica-Bold').text('Item:', { underline: true });
      doc.font('Helvetica');
      let total = 0;

      items.forEach((item, i) => {
        const subtotal = item.qty * item.harga_jual;
        total += subtotal;
        doc.text(`${i + 1}. ${item.nama_produk} (${item.qty} x Rp${item.harga_jual}) = Rp${subtotal}`);
      });

      doc.moveDown();
      doc.text(`Total: Rp${trx.total_transaksi}`, { align: 'right' });
      doc.text(`Diskon: ${trx.diskon}%`, { align: 'right' });
      const after = trx.total_transaksi * (1 - trx.diskon / 100);
      doc.text(`Total Setelah Diskon: Rp${after.toFixed(0)}`, { align: 'right' });

      doc.end();
    });
  });
});

module.exports = router;
