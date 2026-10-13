'use strict';
const { configureTestEnv } = require('../../tests/helpers');
configureTestEnv();
const projectRepo = require('../../src/repositories/projectRepository');

(async () => {
  try {
    const { rows, total } = await projectRepo.listPaged({ q: '', limit: 20, offset: 0 });
    console.log('listPaged OK:', total, rows.length);
  } catch (err) {
    console.error('listPaged FAILED:', err.stack);
  }
  try {
    const app = require('../../src/app').createApp();
    const ejs = require('ejs');
    const path = require('path');
    ejs.renderFile(path.resolve(__dirname, '../../src/views/manage/projects/list.ejs'), {
      title: 'Projects', projects: [], pagination: { page: 1, total: 0, pages: 1, q: '' },
      isAuthenticated: true, csrfToken: 'x',
      formatMonth: (v) => v, formatRange: (s, e) => s,
    }, (err, html) => {
      if (err) console.error('RENDER FAILED:', err.stack || err.message);
      else console.log('RENDER OK', html.length);
      process.exit(0);
    });
  } catch (err) {
    console.error('APP FAILED:', err.stack);
    process.exit(1);
  }
})();
