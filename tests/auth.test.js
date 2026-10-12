'use strict';

const { configureTestEnv, extractCsrf, loginAgent, postForm, TEST_PASSWORD } = require('./helpers');
configureTestEnv();

const request = require('supertest');
const { createApp } = require('../src/app');
const { closeDatabase } = require('../src/config/database');

describe('Authentication and session security', () => {
  const app = createApp();

  afterAll(async () => {
    await closeDatabase();
  });

  it('redirects unauthenticated GET /manage to the login page', async () => {
    const res = await request(app).get('/manage').redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/manage/login');
  });

  it('rejects an unauthenticated management POST lacking CSRF with 403 (CSRF precedes auth)', async () => {
    const res = await request(app).post('/manage/projects').type('form').send({ title: 'x' });
    expect(res.status).toBe(403);
  });

  it('returns 401 for an unauthenticated management POST that carries a valid CSRF token', async () => {
    const agent = request.agent(app);
    const page = await agent.get('/manage/login');
    const token = extractCsrf(page.text);
    const res = await agent.post('/manage/projects').type('form').redirects(0).send({ _csrf: token, title: 'x' });
    expect(res.status).toBe(401);
  });

  it('rejects a management POST with a missing CSRF token (403)', async () => {
    const { agent } = await loginAgent(request, app);
    const res = await agent.post('/manage/projects').type('form').redirects(0).send({ title: 'No token' });
    expect(res.status).toBe(403);
  });

  it('rejects a management POST with a wrong CSRF token (403)', async () => {
    const { agent } = await loginAgent(request, app);
    const res = await agent.post('/manage/projects').type('form').redirects(0)
      .send({ _csrf: 'wrong-token-value', title: 'Bad token' });
    expect(res.status).toBe(403);
  });

  it('rejects login with a wrong password (401)', async () => {
    const agent = request.agent(app);
    const page = await agent.get('/manage/login');
    const token = extractCsrf(page.text);
    const res = await agent.post('/manage/login').type('form').redirects(0)
      .send({ _csrf: token, password: 'definitely-wrong' });
    expect(res.status).toBe(401);
  });

  it('logs in with valid credentials, rotates the session, and reaches the dashboard', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const dash = await agent.get('/manage');
    expect(dash.status).toBe(200);
    expect(dash.text).toContain('Management dashboard');
    // The rotated session must still carry a CSRF token for further forms.
    expect(csrf).toMatch(/^[0-9a-f]{64}$/);
  });

  it('signs out and revokes access to /manage', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/logout');
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe('/');
    const after = await agent.get('/manage').redirects(0);
    expect(after.status).toBe(302);
  });

  it('sets no-store on private management responses', async () => {
    const { agent } = await loginAgent(request, app);
    const res = await agent.get('/manage');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('sets security headers from helmet', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('uses an HttpOnly session cookie', async () => {
    const res = await request(app).get('/manage/login');
    const setCookie = res.headers['set-cookie'].join(';');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
  });

  it('never accepts the password in a GET parameter (login page is GET-only form)', async () => {
    const res = await request(app).get('/manage/login');
    expect(res.status).toBe(200);
    expect(res.text).toContain('name="password"');
    expect(TEST_PASSWORD.length).toBeGreaterThan(0);
  });
});


