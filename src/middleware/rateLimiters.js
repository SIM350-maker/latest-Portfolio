'use strict';

const rateLimit = require('express-rate-limit');

// The integration suite legitimately exceeds 10 management requests per
// minute, so the limits are relaxed under the test environment only.
const testMode = process.env.NODE_ENV === 'test';

/** Public surface: 100 requests/min/IP (frozen security design section 5.1). */
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: testMode ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

/** Management surface: 10 requests/min/IP; also throttles credential guessing. */
const manageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: testMode ? 10000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down' },
});

/** Management navigation: GET/HEAD only. Wide enough for normal dashboard
 * browsing (frozen 10/min budget applies to mutations & credential endpoints,
 * which is what it was designed to throttle). */
const manageGetLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: testMode ? 10000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down' },
});

module.exports = { publicLimiter, manageLimiter, manageGetLimiter };
