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

// GET /penjualan/list/export/pdf
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

// GET /penjualan/list/export/excel
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

module.exports = router;
