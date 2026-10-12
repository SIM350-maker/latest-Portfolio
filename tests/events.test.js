'use strict';

const { configureTestEnv } = require('./helpers');
configureTestEnv();

const { onDataChanged } = require('../src/lib/events');
const { query, closeDatabase } = require('../src/config/database');

describe('data-change event bus (SSE foundation)', () => {
  afterAll(async () => {
    await closeDatabase();
  });

  it('publishes a data-changed event on successful mutations, not on reads or no-ops', async () => {
    const seen = [];
    const unsubscribe = onDataChanged((e) => seen.push(e));

    await query("INSERT INTO skill (name, description, publication_state) VALUES ($1, $2, 'Draft')", ['Event Bus Skill', null]);
    await query('SELECT 1 AS ok');
    await query("UPDATE skill SET publication_state = 'Published' WHERE name = 'Event Bus Skill'");
    await query("DELETE FROM skill WHERE name = 'Event Bus Skill'");
    await query("UPDATE skill SET description = 'no-op' WHERE id = 999999"); // rowCount 0 → no event

    unsubscribe();
    expect(seen.length).toBe(3); // insert + update + delete; SELECT and 0-row UPDATE excluded
    expect(seen.every((e) => e.entity === 'skill' && typeof e.at === 'string')).toBe(true);
  });

  it('excludes internal _migrations writes from the stream', async () => {
    const seen = [];
    const unsubscribe = onDataChanged((e) => seen.push(e));
    await query("INSERT INTO _migrations (filename) VALUES ('__bus_probe__')");
    unsubscribe();
    await query("DELETE FROM _migrations WHERE filename = '__bus_probe__'");
    expect(seen.length).toBe(0);
  });

  it('exposes an unsubscribe that detaches the listener', async () => {
    const seen = [];
    const unsubscribe = onDataChanged((e) => seen.push(e));
    unsubscribe();
    await query("INSERT INTO skill (name, publication_state) VALUES ('__bus_off__', 'Draft') RETURNING id");
    await query("DELETE FROM skill WHERE name = '__bus_off__'");
    expect(seen.length).toBe(0);
  });
});
