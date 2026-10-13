'use strict';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;      // 30 minutes active/idle window
const ABSOLUTE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours absolute

/**
 * Session lifecycle guard (frozen security design section 8):
 * - absolute timeout of 24h since session creation,
 * - idle timeout of 30m since the last request (rolling).
 * Destroyed sessions force re-authentication.
 */
function sessionGuard(req, res, next) {
  if (!req.session) return next();
  const now = Date.now();
  const createdAt = req.session.createdAt;
  const lastSeen = req.session.lastSeen;

  if (!createdAt) {
    req.session.createdAt = now;
    req.session.lastSeen = now;
    return next();
  }
  if (now - createdAt > ABSOLUTE_TIMEOUT_MS || (lastSeen && now - lastSeen > IDLE_TIMEOUT_MS)) {
    req.session.destroy(() => {
      res.clearCookie('portfolio.sid');
      // Re-issue a fresh anonymous session via the normal middleware chain.
      return next();
    });
    return;
  }
  req.session.lastSeen = now;
  return next();
}

/**
 * Authentication guard for /manage/*.
 * - GET navigation without a session: 302 to /manage/login (browser UX).
 * - State-changing POST without a session: 401 per the frozen error contract.
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  if (req.method === 'GET' || req.method === 'HEAD') {
    req.session.returnTo = req.originalUrl;
    return res.redirect('/manage/login');
  }
  return res.status(401).render('error', {
    title: '401 — Unauthenticated',
    heading: '401 — Unauthenticated',
    message: 'You must sign in to perform management operations.',
    isAuthenticated: false,
  });
}

/**
 * Active credential hash: the database value (rotation) supersedes the
 * environment bootstrap hash (OWNER_BCRYPT_HASH), which remains the
 * break-glass credential when no rotation has occurred.
 */
async function getActiveCredentialHash() {
  try {
    const { one } = require('../config/database');
    const row = await one('SELECT password_hash FROM owner_credential ORDER BY id DESC LIMIT 1');
    if (row && row.password_hash) return row.password_hash;
  } catch (_) {
    // Database unavailable: fall through to the environment bootstrap hash.
  }
  return process.env.OWNER_BCRYPT_HASH || '';
}

/** Verify the management credential (constant-time bcrypt comparison). */
async function verifyCredential(password) {
  const hash = await getActiveCredentialHash();
  if (!hash) return false;
  try {
    return require('bcryptjs').compareSync(String(password || ''), hash);
  } catch (_) {
    return false;
  }
}

/** Current credential provenance for the security page. */
async function credentialProvenance() {
  try {
    const { one } = require('../config/database');
    const row = await one('SELECT updated_at FROM owner_credential ORDER BY id DESC LIMIT 1');
    if (row) return { source: 'database (rotated)', rotated_at: row.updated_at };
  } catch (_) { /* fall through to env */ }
  return { source: 'environment bootstrap (OWNER_BCRYPT_HASH)', rotated_at: null };
}

module.exports = { sessionGuard, requireAuth, verifyCredential, getActiveCredentialHash, credentialProvenance, IDLE_TIMEOUT_MS, ABSOLUTE_TIMEOUT_MS };
