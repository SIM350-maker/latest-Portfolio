'use strict';

// Load .env when present (never committed; see .env.example and .gitignore).
const fs = require('fs');
const path = require('path');
if (fs.existsSync(path.resolve(__dirname, '..', '.env'))) {
  // Docker compose interpolates "$VAR" in env_file values, so "$" in bcrypt
  // hashes must be doubled ("$$") in .env; compose unescapes them. dotenv does
  // not, so normalize "$$" -> "$" here for local runs (no other config value
  // legitimately contains consecutive dollar signs).
  const loaded = require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
  for (const [key, value] of Object.entries(loaded.parsed || {})) {
    if (typeof value === 'string' && value.includes('$$')) {
      process.env[key] = value.replace(/\$\$/g, '$');
    }
  }
}

const { startServer } = require('./app');

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  console.error('FATAL: PORT must be an integer between 1 and 65535.');
  process.exit(1);
}

try {
  startServer(PORT);
} catch (err) {
  // Config/DB failures (missing secrets, unreadable or corrupt database, bad
  // DB_PATH) land here with a clear message; no stack dump for operators.
  console.error('FATAL: ' + (err && err.message ? err.message : err));
  process.exit(1);
}
