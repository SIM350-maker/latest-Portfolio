'use strict';

/**
 * Basic application logger. Logs method, path (no query string — query
 * strings must not carry sensitive data) and status; never credentials,
 * cookies, or session identifiers.
 */
function logger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const line = req.method + ' ' + req.path + ' -> ' + res.statusCode + ' (' + (Date.now() - start) + 'ms)';
    if (res.statusCode >= 500) {
      console.error(line);
    } else if (req.path !== '/health') {
      console.log(line);
    }
  });
  next();
}

module.exports = logger;
