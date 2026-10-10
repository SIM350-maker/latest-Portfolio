'use strict';

// Load .env when present (never committed; see .env.example and .gitignore).
const fs = require('fs');
const path = require('path');
if (fs.existsSync(path.resolve(__dirname, '..', '.env'))) {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
}

const { startServer } = require('./app');

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error('FATAL: PORT must be an integer between 1 and 65535.');
  process.exit(1);
}

startServer(PORT);
