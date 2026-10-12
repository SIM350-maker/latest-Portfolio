'use strict';

// Request-scoped context (AsyncLocalStorage). Carries the authenticated
// principal from middleware into the data layer so audit triggers can record
// WHO changed a row (audit_log.changed_by via the app.user_id GUC).

const { AsyncLocalStorage } = require('async_hooks');

const als = new AsyncLocalStorage();

/** Run fn with a request store { user }. ALS propagates through async/await. */
function runContext(store, fn) {
  return als.run(store, fn);
}

/** Current principal label ('owner' | 'reader' | null) for this async chain. */
function getRequestUser() {
  const store = als.getStore();
  return store && store.user ? store.user : null;
}

module.exports = { runContext, getRequestUser };
