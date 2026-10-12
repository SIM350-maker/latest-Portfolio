'use strict';

// Regression: production HTTP must still issue session cookies (secure: 'auto').
// Must set NODE_ENV=production BEFORE requiring src/app (per-file module registry
// gives this suite a production-configured app instance).

process.env.NODE_ENV = 'production';
process.env.SESSION_SECRET = require('crypto').randomBytes(32).toString('hex');
process.env.OWNER_BCRYPT_HASH = require('bcryptjs').hashSync('prod-cookie-test', 12);
process.env.DB_PATH = require('path').join(require('os').tmpdir(), 'portfolio-prodcookie-' + require('crypto').randomBytes(6).toString('hex') + '.db');

const request = require('supertest');
const { createApp } = require('../src/app');
const { closeDatabase } = require('../src/config/database');
const { extractCsrf } = require('./helpers');

describe('production HTTP session cookies (secure: auto)', () => {
  const app = createApp();


  afterAll(async () => {
    await closeDatabase();
  });

  it('GET /manage/login sets a portfolio.sid session cookie over plain HTTP', async () => {
    const res = await request(app).get('/manage/login');
    expect(res.status).toBe(200);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    const cookieLine = Array.isArray(setCookie) ? setCookie.join('; ') : String(setCookie);
    expect(cookieLine).toContain('portfolio.sid');
  });

  it('full login flow works over plain HTTP in production (303 + authenticated dashboard)', async () => {
    const agent = request.agent(app);
    const loginPage = await agent.get('/manage/login');
    const csrf = extractCsrf(loginPage.text);
    const res = await agent
      .post('/manage/login')
      .type('form')
      .redirects(0)
      .send({ _csrf: csrf, password: 'prod-cookie-test' });
    expect(res.status).toBe(303);
    const dash = await agent.get('/manage');
    expect(dash.status).toBe(200);
    expect(dash.text).toContain('Management dashboard');
  });
});



