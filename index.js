require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const dbPath = path.join(__dirname, 'database.sqlite'); // ganti jika nama file beda
const PORT = process.env.PORT || 3000;
const SERVERIP = process.env.SERVERIP;

console.log('Server IP:', process.env.SERVERIP);
console.log('Port:', process.env.PORT);
// Middleware
app.use(express.json());

// Inisialisasi DB jika belum ada
if (!fs.existsSync(dbPath)) {
  console.log("Database belum ada. Menjalankan db_init.js...");
  require('./db_init');
} else {
  console.log("Database sudah tersedia.");
}

// Import routes
const routesPath = path.join(__dirname, 'routes');
fs.readdirSync(routesPath).forEach((file) => {
  const route = require(`./routes/${file}`);
  const routeName = `/${file.replace('.js', '')}`;
  app.use(routeName, route);
});

// Root endpoint
app.get('/', (req, res) => {
  res.send('API Kantin aktif');
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://${SERVERIP}:${PORT}`);
});