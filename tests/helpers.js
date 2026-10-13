'use strict';

const os = require('os');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const TEST_PASSWORD = 'test-management-password';

/**
 * Configure a unique per-process test database and required environment.
 * Must be called BEFORE requiring src/app so configuration checks pass.
 *
 * Driver policy:
 *  - default: SQLite (hermetic, no external services, per-worker tmp file).
 *  - CI matrix lane sets DB_DRIVER=postgres + DATABASE_URL (a throwaway
 *    Postgres — Neon rehearsal branch or service container); tests/jest-global-setup.js
 *    then resets the schema once for the whole run and suites execute serially
 *    (--runInBand) against the shared database.
 */
function configureTestEnv() {
  process.env.NODE_ENV = 'test';
  if (!process.env.DB_DRIVER) {
    process.env.DB_DRIVER = 'sqlite';
  }
  if (process.env.DB_DRIVER === 'sqlite') {
    process.env.DB_PATH = path.join(os.tmpdir(), 'portfolio-test-' + crypto.randomBytes(6).toString('hex') + '.db');
  }
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = crypto.randomBytes(32).toString('hex');
  }
  if (!process.env.OWNER_BCRYPT_HASH) {
    process.env.OWNER_BCRYPT_HASH = bcrypt.hashSync(TEST_PASSWORD, 12);
  }
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

/**
 * Wipe all application data between suites. Gives every suite the clean-database
 * semantics the per-worker SQLite files used to provide — required when the
 * whole run shares one PostgreSQL database (CI matrix lane / Neon rehearsal).
 * Driver-neutral: TRUNCATE ... RESTART IDENTITY CASCADE on PostgreSQL, ordered
 * DELETEs on SQLite.
 */
async function resetTestData() {
  if (process.env.DB_DRIVER === 'postgres') {
    const { query } = require('../src/config/database');
    await query(
      'TRUNCATE profile, project, skill, evidence, claim, experience, education, ' +
      'certifications, cv_references, recommendations, contact_messages, owner_credential, ' +
      'project_skill, project_evidence, skill_evidence, claim_evidence RESTART IDENTITY CASCADE'
    );
    return;
  }
  const { connectDB } = require('../src/config/database');
  const db = connectDB();
  for (const table of [
    'project_skill', 'project_evidence', 'skill_evidence', 'claim_evidence', 'owner_credential',
    'certifications', 'cv_references', 'recommendations', 'contact_messages',
    'experience', 'education', 'claim', 'evidence', 'skill', 'project', 'profile',
  ]) {
    db.prepare('DELETE FROM ' + table).run();
  }
}

module.exports = { configureTestEnv, extractCsrf, loginAgent, postForm, TEST_PASSWORD, resetTestData };


