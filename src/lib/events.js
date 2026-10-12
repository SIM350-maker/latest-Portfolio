'use strict';

// In-process event bus (data-architecture plan, requirement 4 — near-real-time
// DB → UI reflection). Repositories mutate through query(); any successful
// non-SELECT statement publishes a 'data-changed' event. The authenticated
// SSE channel (/manage/events) forwards these to open manage sessions; the
// manage client script refreshes the view so cross-session changes appear
// without manual reloads.

const { EventEmitter } = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(50); // one listener per open manage session

/** Broadcast that persisted data changed. entity is advisory ('skill', …). */
function publishDataChanged(entity) {
  bus.emit('data-changed', { entity: entity || 'data', at: new Date().toISOString() });
}

/** Subscribe to data changes. Returns an unsubscribe function. */
function onDataChanged(listener) {
  bus.on('data-changed', listener);
  return () => bus.off('data-changed', listener);
}

/** Best-effort entity guess from the SQL statement (for nicer client logs). */
function entityFromSql(sql) {
  const m = /\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([a-z_]+)/i.exec(sql);
  return m ? m[1] : 'data';
}

module.exports = { publishDataChanged, onDataChanged, entityFromSql };
