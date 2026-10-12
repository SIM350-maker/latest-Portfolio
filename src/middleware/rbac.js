'use strict';

// Role-based access control (data-architecture plan, requirement 6).
//
// Role model for this system:
//   reader — anonymous visitor: may read PUBLISHED data only. Enforced by the
//            GET-only boundary on public routes, publication_state filters in
//            repositories, and no public write endpoints (POSTs to public
//            routes are rejected by the method contract before CSRF runs).
//   owner  — authenticated administrator (single credential, bcrypt-verified
//            session): full CRUD across all entities via /manage/*.
//
// attachPrincipal runs after the session middleware and stamps every request
// with req.principal. requireRole(...) is the generic gate; for the existing
// manage surface requireAuth remains the owner gate (identical semantics).

const { requireAuth } = require('./auth');

/** Stamp req.principal with the caller's role (defaults to 'reader'). */
function attachPrincipal(req, res, next) {
  const authenticated = Boolean(req.session && req.session.authenticated);
  req.principal = {
    role: authenticated ? 'owner' : 'reader',
    authenticated,
  };
  next();
}

/**
 * Gate: allow only the listed roles.
 * - Readers on a protected GET are redirected to sign in (browser UX).
 * - Readers on a protected write get the 401 error contract (matches the
 *   frozen error handling: unauthenticated mutation -> 401).
 */
function requireRole(...roles) {
  return (req, res, next) => {
    const role = req.principal && req.principal.role;
    if (roles.includes(role)) return next();
    if (req.method === 'GET' || req.method === 'HEAD') {
      req.session.returnTo = req.originalUrl;
      return res.redirect('/manage/login');
    }
    return res.status(401).render('error', {
      title: '401 — Unauthenticated',
      heading: '401 — Unauthenticated',
      message: 'Your role does not permit this operation.',
      isAuthenticated: false,
    });
  };
}

/** The admin (owner) gate — explicit alias so call sites read as intent. */
const requireOwner = requireAuth;

module.exports = { attachPrincipal, requireRole, requireOwner };
