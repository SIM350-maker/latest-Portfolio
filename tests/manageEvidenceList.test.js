'use strict';

const { configureTestEnv, loginAgent, extractCsrf, postForm } = require('./helpers');
configureTestEnv();

const request = require('supertest');
const { createApp } = require('../src/app');
const evidenceRepo = require('../src/repositories/evidenceRepository');
const { connectDB } = require('../src/config/database');

describe('MOD-004 — GET /manage/evidence', () => {
  const app = createApp();

  afterEach(() => {
    connectDB().prepare('DELETE FROM evidence').run();
  });

  it('MOD-004 — evidence listing — returns 200 with two seeded evidence rows', async () => {
    evidenceRepo.create({ description: 'Alpha verification screenshot', file_path: 'https://example.com/alpha.png', file_type: 'document' });
    evidenceRepo.create({ description: 'Beta deployment record', file_path: 'https://example.com/beta', file_type: 'deployment' });
    const { agent } = await loginAgent(request, app);
    const res = await agent.get('/manage/evidence');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('MOD-004 — evidence listing — response body contains both seeded rows identifying fields', async () => {
    evidenceRepo.create({ description: 'Gamma interface contract', file_path: 'https://example.com/gamma.md', file_type: 'document' });
    evidenceRepo.create({ description: 'Delta load test log', file_path: 'https://example.com/delta.log', file_type: 'deployment' });
    const { agent } = await loginAgent(request, app);
    const res = await agent.get('/manage/evidence');
    expect(res.text).toContain('Gamma interface contract');
    expect(res.text).toContain('Delta load test log');
    expect(res.text).toContain('https://example.com/gamma.md');
    expect(res.text).toContain('https://example.com/delta.log');
  });

  it('MOD-004 — evidence listing — feeds the reverse-traceability query with zero claims (supports no claims)', async () => {
    evidenceRepo.create({ description: 'Epsilon unlinked record', file_path: null, file_type: null });
    const { agent } = await loginAgent(request, app);
    const res = await agent.get('/manage/evidence');
    expect(res.text).toContain('Epsilon unlinked record');
    expect(res.text).toContain('supports no claims');
  });

  it('MOD-004 — evidence listing — sets Cache-Control: no-store', async () => {
    evidenceRepo.create({ description: 'Zeta cache check', file_path: 'https://example.com/zeta', file_type: 'deployment' });
    const { agent } = await loginAgent(request, app);
    const res = await agent.get('/manage/evidence');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.headers['pragma']).toBe('no-cache');
  });

  it('MOD-004 — POST /manage/evidence — returns 401 when unauthenticated', async () => {
    const agent = request.agent(app);
    const page = await agent.get('/manage/login');
    const token = extractCsrf(page.text);
    const res = await agent
      .post('/manage/evidence')
      .type('form')
      .redirects(0)
      .send({ _csrf: token, description: 'unauthenticated attempt' });
    expect(res.status).toBe(401);
  });

  it('MOD-004 — GET /manage/evidence — redirects unauthenticated GET navigation to the login page with 302', async () => {
    const res = await request(app).get('/manage/evidence').redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/manage/login');
  });

  it('MOD-004 — GET on a POST-only sibling (/manage/evidence/:id/accessibility) — returns 404 per the frozen error contract', async () => {
    const { agent } = await loginAgent(request, app);
    const res = await agent.get('/manage/evidence/1/accessibility');
    expect(res.status).toBe(404);
  });

  it('MOD-004 — POST /manage/evidence/:id/delete — returns 404 for a non-existent evidence ID', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/evidence/999999/delete');
    expect(res.status).toBe(404);
    expect(res.text).toContain('404 — Not found');
  });
});
