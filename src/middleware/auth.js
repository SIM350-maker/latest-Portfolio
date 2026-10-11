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

/** Verify the management credential (constant-time bcrypt comparison). */
function verifyCredential(password, bcrypt) {
  const hash = process.env.OWNER_BCRYPT_HASH || '';
  if (!hash) return false;
  try {
    return bcrypt.compareSync(String(password || ''), hash);
  } catch (_) {
    return false;
  }
}

module.exports = { sessionGuard, requireAuth, verifyCredential, IDLE_TIMEOUT_MS, ABSOLUTE_TIMEOUT_MS };
