'use strict';

const crypto = require('crypto');

/**
 * Synchronizer-token CSRF protection (frozen security design section 10).
 * - A per-session token is issued on first request.
 * - Every state-changing request (non-GET/HEAD/OPTIONS) must present the
 *   token in the _csrf form field or x-csrf-token header.
 * - Invalid or missing token => 403, with no command side effects.
 */
function csrfMiddleware(req, res, next) {
  if (!req.session) return next();
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;

  const safe = ['GET', 'HEAD', 'OPTIONS'];
  if (safe.includes(req.method)) return next();

  const presented = (req.body && req.body._csrf) || req.get('x-csrf-token') || '';
  if (!presented || typeof presented !== 'string' || presented !== req.session.csrfToken) {
    return res.status(403).render('error', {
      title: '403 — Forbidden',
      heading: '403 — Forbidden',
      message: 'Invalid or missing CSRF token. Go back, reload the form, and try again.',
      isAuthenticated: Boolean(req.session && req.session.authenticated),
    });
  }
  return next();
}

module.exports = { csrfMiddleware };
