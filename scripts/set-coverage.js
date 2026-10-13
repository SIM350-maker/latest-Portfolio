'use strict';
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
p.scripts['test:coverage'] = 'jest --coverage';
p.jest.collectCoverageFrom = ['src/**/*.js', '!src/db/**', '!src/server.js'];
p.jest.coverageThreshold = {
  global: { statements: 65, branches: 55, functions: 65, lines: 70 },
  './src/repositories/': { lines: 78 },
  './src/routes/': { lines: 75 },
  './src/middleware/': { lines: 78 },
  './src/config/': { lines: 72 },
  './src/lib/': { lines: 85 },
};
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
console.log('coverage config written:', JSON.stringify(p.jest.coverageThreshold));
