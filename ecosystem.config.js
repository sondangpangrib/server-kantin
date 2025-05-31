module.exports = {
  apps: [{
    name: 'webserver_kantin',
    script: 'index.js',
    watch: true,
    watch_options: {
      followSymlinks: false,
      usePolling: false,
      interval: 1000
    },
    ignore_watch: [
      'node_modules',
      'database.sqlite',
      'sqliteadmin', 
      'uploads',
      '.vscode',
      '.env',
      '*.log',
      'package-lock.json',
      'package.json',
      '.gitignore' 
    ]
  }]
}