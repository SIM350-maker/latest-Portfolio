'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectDB, closeDatabase, getDriver } = require('./config/database');
const { sessionGuard, ABSOLUTE_TIMEOUT_MS } = require('./middleware/auth');
const { attachPrincipal } = require('./middleware/rbac');
const { runContext } = require('./lib/requestContext');
const { csrfMiddleware } = require('./middleware/csrf');
const { publicLimiter, manageLimiter, manageGetLimiter } = require('./middleware/rateLimiters');
const { noStorePrivate } = require('./middleware/noStore');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const healthRouter = require('./routes/health');
const publicRoutes = require('./routes/publicRoutes');
const manageRoutes = require('./routes/manageRoutes');

const isProd = () => process.env.NODE_ENV === 'production';

/**
 * Validate required configuration at startup; fail fast with actionable
 * messages. Secrets are checked for presence only — never logged.
 */
function requireConfiguration() {
  const problems = [];
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    problems.push('SESSION_SECRET must be set to at least 32 characters.');
  }
  if (!process.env.OWNER_BCRYPT_HASH) {
    problems.push('OWNER_BCRYPT_HASH must be set to a bcrypt hash (see .env.example).');
  }
  if (problems.length > 0) {
    throw new Error('Missing configuration:\n  - ' + problems.join('\n  - '));
  }
}

/** Build the fully configured application (initializes the database). */
function createApp() {
  requireConfiguration();
  if (getDriver() === 'sqlite') connectDB(); // fail fast: pragma verification + schema apply
  // PostgreSQL: server.js awaits initDatabase() (connect + schema with retry).

  const app = express();
  app.disable('x-powered-by');
  if (isProd()) app.set('trust proxy', 1);
  app.set('view engine', 'ejs');
  // View-layer formatting helpers (EJS resolves app.locals automatically).
  const { formatMonth, formatRange } = require('./lib/format');
  app.locals.formatMonth = formatMonth;
  app.locals.formatRange = formatRange;
  app.set('views', path.resolve(__dirname, 'views'));

  // 1. Security headers (helmet defaults include CSP, HSTS, nosniff, frameguard).
  app.use(helmet());

  // 2. Body parsing — must precede CSRF verification (token arrives in body).
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(express.json({ limit: '100kb' }));

  // 3. Sessions: HTTPOnly, SameSite=Lax, Secure when the connection is HTTPS
  //    ('auto' + trust proxy: TLS-terminating reverse proxies keep the Secure
  //    flag; plain-HTTP first-release demos still get sessions — decision
  //    logged 2026-10-11, docs/14-DECISION-LOG.md). 24h absolute cookie
  //    lifetime; rolling refresh supports the 30m idle timeout.
  app.use(require('express-session')({
    name: 'portfolio.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true, // anonymous sessions carry the CSRF token
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: 'auto',
      sameSite: 'lax',
      maxAge: ABSOLUTE_TIMEOUT_MS,
    },
  }));

  // 4. Session lifecycle: 30m idle / 24h absolute (frozen security design).
  app.use(sessionGuard);

  // 4b. Role-based access control principal (owner | reader) — requirement 6.
  app.use(attachPrincipal);

  // 4c. Request context: propagates the principal into the data layer so
  //     audit triggers can attribute mutations (audit_log.changed_by).
  app.use((req, res, next) => {
    const user = req.principal && req.principal.authenticated ? 'owner' : 'reader';
    runContext({ user }, () => next());
  });

  // 5. Rate limiting: 100/min public; management mutations & credential
  //    endpoints 10/min (frozen section 5.1 — the anti-guessing budget);
  //    management navigation GETs 60/min so normal dashboard browsing works.
  app.use((req, res, next) => {
    if (req.path.startsWith('/manage')) {
      if (req.method === 'GET' || req.method === 'HEAD') return manageGetLimiter(req, res, next);
      return manageLimiter(req, res, next);
    }
    return publicLimiter(req, res, next);
  });

  // 6. Private responses must never be cached.
  app.use(noStorePrivate);

  // 6b. Public boundary is GET-only: state-changing methods are accepted
  //     exclusively under /manage; everywhere else returns 405. This check
  //     precedes CSRF so the method contract is not masked by token errors.
  app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.path.startsWith('/manage')) return next();
    return res.status(405).json({ error: 'Method Not Allowed' });
  });

  // 7. CSRF: issue per-session token; verify every state-changing request.
  app.use(csrfMiddleware);

  // 8. Request logging (no credentials, cookies, or query strings).
  app.use(logger);
  if (!isProd()) app.use(morgan('dev'));

  // 9. Static assets.
  app.use(express.static(path.resolve(__dirname, '..', 'public')));

  // 10. Routes: health (public), manage (authenticated), public site.
  app.use('/health', healthRouter);
  app.use('/manage', manageRoutes);
  app.use('/', publicRoutes);

  // 11. 404 for everything else.
  app.use((req, res) => {
    if (req.accepts('html') && !req.path.startsWith('/health')) {
      return res.status(404).render('error', {
        title: '404 — Not found',
        heading: '404 — Not found',
        message: 'The page you requested does not exist.',
        isAuthenticated: Boolean(req.session && req.session.authenticated),
      });
    }
    return res.status(404).json({ error: 'Not Found' });
  });

  // 12. Centralized error handling — last.
  app.use(errorHandler);

  return app;
}

/** Start the HTTP server (used by src/server.js, not by tests). */
function startServer(port) {
  const app = createApp();
  const server = app.listen(port, () => {
    console.log('Server is running on port ' + port + ' (' + process.env.NODE_ENV + ')');
  });
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error('FATAL: Port ' + port + ' is already in use. Stop the other process (e.g. an existing container or dev server) or set PORT to a free port, then try again.');
    } else if (err && err.code === 'EACCES') {
      console.error('FATAL: Port ' + port + ' requires elevated privileges. Set PORT to a value above 1024.');
    } else {
      console.error('FATAL: Server failed to start: ' + (err && err.message ? err.message : err));
    }
    process.exit(1);
  });
  const shutdown = (signal) => {
    console.log(signal + ' received: shutting down');
    server.close(() => {
      closeDatabase() // close the active driver (SQLite handle or pg pool)
        .catch(() => {})
        .finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  return server;
}

module.exports = { createApp, startServer };
