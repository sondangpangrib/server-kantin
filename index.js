require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const morgan = require('morgan');
const dbPath = path.join(__dirname, 'database.sqlite'); // ganti jika nama file beda
const PORT = process.env.PORT;
const SERVERIP = process.env.SERVERIP;
const imgRoute = require("./img");

console.log('Server IP:', process.env.SERVERIP);
console.log('Port:', process.env.PORT);  

// Middleware
app.use(express.json()); // WAJIB paling atas
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Inisialisasi DB jika belum ada
const initDB = require('./db_init');
if (fs.existsSync(dbPath)) {
  console.log("Database belum ada. Menjalankan inisialisasi...");
  initDB(dbPath);
}

// Import routes
const routesPath = path.join(__dirname, 'routes');
fs.readdirSync(routesPath).forEach((file) => {
  const route = require(`./routes/${file}`);
  const routeName = `/${file.replace('.js', '')}`;
   console.log(`[DEBUG] Memasang route ${routeName}`);
   console.log(`[DEBUG] Mounting ${file}`);
  app.use(routeName, route);
});
app.use("/img",imgRoute); 
// Root endpoint
app.get('/', (req, res) => {
  res.send('API Kantin aktif');
});
app.use((req, res) => {
  console.log(`[DEBUG] ROUTE TIDAK DIKENAL: ${req.method} ${req.url}`);
  res.status(404).send('Route tidak ditemukan');
});
// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://${SERVERIP}:${PORT}`);
});