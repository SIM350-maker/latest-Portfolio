'use strict';

/** Cache-control: no-store on all /manage responses (frozen security design section 14). */
function noStorePrivate(req, res, next) {
  if (req.path.startsWith('/manage')) {
    res.set('Cache-Control', 'no-store');
    res.set('Pragma', 'no-cache');
  }
  next();
}

module.exports = { noStorePrivate };
