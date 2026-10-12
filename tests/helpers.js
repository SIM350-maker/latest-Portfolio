'use strict';

const os = require('os');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const TEST_PASSWORD = 'test-management-password';

/**
 * Configure a unique per-process test database and required environment.
 * Must be called BEFORE requiring src/app so configuration checks pass.
 * Tests always run on the SQLite driver (hermetic, no external services);
 * the PostgreSQL pipeline is covered separately by tests/postgresPipeline.test.js.
 */
function configureTestEnv() {
  process.env.NODE_ENV = 'test';
  process.env.DB_DRIVER = 'sqlite';
  process.env.DB_PATH = path.join(os.tmpdir(), 'portfolio-test-' + crypto.randomBytes(6).toString('hex') + '.db');
  process.env.SESSION_SECRET = crypto.randomBytes(32).toString('hex');
  process.env.OWNER_BCRYPT_HASH = bcrypt.hashSync(TEST_PASSWORD, 12);
}

/** Extract the CSRF token from a rendered form page. */
function extractCsrf(html) {
  const m = /name="_csrf"\s+value="([^"]+)"/.exec(html) || /value="([^"]+)"\s+name="_csrf"/.exec(html);
  if (!m) throw new Error('CSRF token not found in page HTML');
  return m[1];
}

/** Create a supertest agent signed in to the management interface. */
async function loginAgent(request, app) {
  const agent = request.agent(app);
  const loginPage = await agent.get('/manage/login').redirects(0);
  const token = extractCsrf(loginPage.text);
  const res = await agent
    .post('/manage/login')
    .type('form')
    .redirects(0)
    .send({ _csrf: token, password: TEST_PASSWORD });
  if (res.status !== 303) {
    throw new Error('Login failed in test helper with status ' + res.status);
  }
  return { agent, csrf: token };
}

/** POST helper with CSRF token attached. */
function postForm(agent, csrf, url, fields) {
  return agent.post(url).type('form').redirects(0).send({ _csrf: csrf, ...(fields || {}) });
}

module.exports = { configureTestEnv, extractCsrf, loginAgent, postForm, TEST_PASSWORD };
