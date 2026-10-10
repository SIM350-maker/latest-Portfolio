'use strict';

const { configureTestEnv, loginAgent, postForm } = require('./helpers');
configureTestEnv();

const request = require('supertest');
const { createApp } = require('../src/app');

describe('Content validation and error contracts', () => {
  const app = createApp();

  it('rejects a project without a title (400 with field errors)', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/projects', { title: '   ' });
    expect(res.status).toBe(400);
    expect(res.text).toContain('This field is required.');
  });

  it('rejects a skill with a duplicate name (400)', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    await postForm(agent, csrf, '/manage/skills', { name: 'Docker' });
    const dupe = await postForm(agent, csrf, '/manage/skills', { name: 'docker' });
    expect(dupe.status).toBe(400);
    expect(dupe.text).toContain('already exists');
  });

  it('returns 404 for unknown routes (HTML) and unknown project detail', async () => {
    const missing = await request(app).get('/definitely-not-here');
    expect(missing.status).toBe(404);
    expect(missing.text).toContain('404');
    const detail = await request(app).get('/projects/999999');
    expect(detail.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent claim (MOD-004-010)', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/claims/999999/delete');
    expect(res.status).toBe(404);
    expect(res.text).toContain('404 — Not found');
  });

  it('updates an existing claim via POST /manage/claims/:id (MOD-006-001)', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    await postForm(agent, csrf, '/manage/claims', { statement: 'Original claim statement' });
    const claimId = require('../src/repositories/claimRepository').listAll()[0].id;
    const res = await postForm(agent, csrf, `/manage/claims/${claimId}`, {
      statement: 'Updated claim statement',
      justification: 'Updated justification',
    });
    expect(res.status).toBe(303);
    expect(res.headers.location).toBe('/manage/claims');
    const list = await agent.get('/manage/claims');
    expect(list.text).toContain('Updated claim statement');
    expect(list.text).not.toContain('Original claim statement');
  });

  it('returns 400 with field errors when updating a claim without a statement (MOD-006-001)', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    await postForm(agent, csrf, '/manage/claims', { statement: 'Claim for validation' });
    const claimId = require('../src/repositories/claimRepository').listAll()[0].id;
    const res = await postForm(agent, csrf, `/manage/claims/${claimId}`, { statement: '   ' });
    expect(res.status).toBe(400);
    expect(res.text).toContain('This field is required.');
  });

  it('returns 404 when updating a non-existent claim (MOD-006-001)', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/claims/999999', { statement: 'Ghost claim' });
    expect(res.status).toBe(404);
    expect(res.text).toContain('404 — Not found');
  });

  it('validates profile creation via the management form', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const bad = await postForm(agent, csrf, '/manage/profile', { name: '', role: '', summary: '' });
    expect(bad.status).toBe(400);
    const good = await postForm(agent, csrf, '/manage/profile', {
      name: 'Jane Engineer', role: 'Senior Software Engineer',
      summary: 'Builds verifiable systems.', contact_info: 'jane@example.com',
    });
    expect(good.status).toBe(303);
    const page = await agent.get('/manage/profile');
    expect(page.text).toContain('Jane Engineer');
  });

  it('renders the public homepage only after the profile is published (FR-001)', async () => {
    const before = await request(app).get('/');
    expect(before.text).not.toContain('Jane Engineer');

    const { agent, csrf } = await loginAgent(request, app);
    await postForm(agent, csrf, '/manage/profile/publish');
    const after = await request(app).get('/');
    expect(after.status).toBe(200);
    expect(after.text).toContain('Jane Engineer');
    expect(after.text).toContain('Senior Software Engineer');
  });
});

