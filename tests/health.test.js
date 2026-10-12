'use strict';

require('./helpers').configureTestEnv();
const request = require('supertest');
const { createApp } = require('../src/app');
const { closeDatabase } = require('../src/config/database');

describe('Health endpoint', () => {
  const app = createApp();

  afterAll(async () => {
    await closeDatabase();
  });

  it('returns OK with a verified database check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('database', 'up');
  });
});

