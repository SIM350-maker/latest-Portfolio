'use strict';

const { isOperationalError } = require('../config/database');

/**
 * Centralized error handler (frozen design section 5):
 * - 4xx from typed errors (ValidationError 400, ConflictError 409, etc.)
 * - 500 otherwise; stack traces only logged, never sent in production.
 * - Credentials/session data are never logged.
 */
function errorHandler(err, req, res, next) {
  const status = err && err.status ? err.status : 500;
  const isValidation = err && err.name === 'ValidationError';
  const logContext = {
    method: req.method,
    url: req.originalUrl,
    status,
    name: err && err.name,
    code: err && err.code,
  };
  if (status >= 500) {
    console.error('Unhandled error:', JSON.stringify(logContext));
    if (isOperationalError(err)) {
      console.error('Database error code:', err.code);
    }
  }

  if (req.accepts('html') && !req.path.startsWith('/health')) {
    if (isValidation) {
      return res.status(400).render('error', {
        title: '400 — Invalid input',
        heading: '400 — Invalid input',
        message: err.message,
        fieldErrors: err.fieldErrors || {},
        isAuthenticated: Boolean(req.session && req.session.authenticated),
      });
    }
    const headings = {
      400: '400 — Bad request',
      401: '401 — Unauthenticated',
      403: '403 — Forbidden',
      404: '404 — Not found',
      409: '409 — Conflict',
    };
    return res.status(status).render('error', {
      title: headings[status] || '500 — Internal Server Error',
      heading: headings[status] || '500 — Internal Server Error',
      message: status >= 500
        ? 'Something went wrong on our side. The issue has been logged.'
        : err.message || 'The request could not be completed.',
      fieldErrors: {},
      isAuthenticated: Boolean(req.session && req.session.authenticated),
    });
  }

  const body = { error: status >= 500 ? 'Internal Server Error' : err.message || 'Error' };
  if (isValidation) body.fieldErrors = err.fieldErrors || {};
  return res.status(status).json(body);
}

module.exports = errorHandler;
