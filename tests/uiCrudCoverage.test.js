'use strict';

// UI CRUD coverage: every mutation endpoint must be reachable from the
// management UI (audit gap fix). Drives the real forms the way the browser does.

const { configureTestEnv, loginAgent, postForm, TEST_PASSWORD, resetTestData } = require('./helpers');
configureTestEnv();

const request = require('supertest');
const { createApp } = require('../src/app');
const skillRepo = require('../src/repositories/skillRepository');
const experienceRepo = require('../src/repositories/experienceRepository');
const educationRepo = require('../src/repositories/educationRepository');
const claimRepo = require('../src/repositories/claimRepository');
const projectRepo = require('../src/repositories/projectRepository');
const profileRepo = require('../src/repositories/profileRepository');
const evidenceRepo = require('../src/repositories/evidenceRepository');
const { connectDB } = require('../src/config/database');
const { verifyCredential } = require('../src/middleware/auth');

describe('UI CRUD coverage — edit forms reach UPDATE endpoints', () => {
  const app = createApp();

  beforeEach(async () => {
    const db = connectDB();
    for (const t of ['project_skill', 'project_evidence', 'skill_evidence', 'claim_evidence', 'experience', 'education', 'claim', 'evidence', 'skill', 'project']) {
      db.prepare('DELETE FROM ' + t).run();
    }
    if (!(await profileRepo.getProfile())) {
      await profileRepo.createProfile({ name: 'UI Owner', role: 'Engineer', summary: 'profile', contact_info: null });
    }
  });


  it('skills — edit disclosure posts name/category/description to the update endpoint', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const id = await skillRepo.create({ name: 'Old Name', category: 'Programming', description: 'old' });

    // the edit form must be present with pre-filled values
    const listPage = await agent.get('/manage/skills');
    expect(listPage.text).toContain('value="Old Name"');
    expect(listPage.text).toContain(`action="/manage/skills/${id}"`);

    const res = await postForm(agent, csrf, '/manage/skills/' + id, {
      name: 'New Name', category: 'Databases', description: 'updated description',
    });
    expect(res.status).toBe(303);
    const row = await skillRepo.getById(id);
    expect(row.name).toBe('New Name');
    expect(row.category).toBe('Databases');
    expect(row.description).toBe('updated description');
  });

  it('experience — edit form updates location/is_current through the UI', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const id = await experienceRepo.create({ title: 'Dev', company: 'Co', start_date: '2023-01' });

    const listPage = await agent.get('/manage/experience');
    expect(listPage.text).toContain(`action="/manage/experience/${id}"`);
    expect(listPage.text).toContain('name="is_current"');

    const res = await postForm(agent, csrf, '/manage/experience/' + id, {
      title: 'Lead Dev', company: 'Co', location: 'Nairobi, Kenya',
      start_date: '2023-01', end_date: '', is_current: 'on', description: 'leading the team',
    });
    expect(res.status).toBe(303);
    const row = await experienceRepo.getById(id);
    expect(row.title).toBe('Lead Dev');
    expect(row.location).toBe('Nairobi, Kenya');
    expect(Boolean(row.is_current)).toBe(true);
  });

  it('education — edit form updates grade through the UI', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const id = await educationRepo.create({ institution: 'Old U', degree: 'BA', start_date: '2010-09' });

    const listPage = await agent.get('/manage/education');
    expect(listPage.text).toContain(`action="/manage/education/${id}"`);
    expect(listPage.text).toContain('name="grade"');

    const res = await postForm(agent, csrf, '/manage/education/' + id, {
      institution: 'Chuka University', degree: 'BSc', field_of_study: 'CS',
      start_date: '2022-09', end_date: '2026-04', grade: 'Second Class Honours', description: '',
    });
    expect(res.status).toBe(303);
    const row = await educationRepo.getById(id);
    expect(row.grade).toBe('Second Class Honours');
    const renderedEdu = await agent.get('/manage/education');
    expect(renderedEdu.text).toContain('Second Class Honours'); // grade surfaced in the list
  });

  it('claims — edit disclosure posts statement/justification to the update endpoint', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const id = await claimRepo.create({ statement: 'Original statement' });

    const listPage = await agent.get('/manage/claims');
    expect(listPage.text).toContain(`action="/manage/claims/${id}"`);
    expect(listPage.text).toContain('value="Original statement"');

    const res = await postForm(agent, csrf, '/manage/claims/' + id, {
      statement: 'Updated statement', justification: 'now justified',
    });
    expect(res.status).toBe(303);
    const row = await claimRepo.getById(id);
    expect(row.statement).toBe('Updated statement');
    expect(row.justification).toBe('now justified');
  });

  it('projects — attach-evidence and attach-skill forms post to the join endpoints', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const projectId = await projectRepo.create({ title: 'Linkable Project' });
    const evidenceId = await evidenceRepo.create({ description: 'proof', file_path: 'https://example.com/p.png' });
    const skillId = await skillRepo.create({ name: 'Attachable Skill' });

    const listPage = await agent.get('/manage/projects');
    expect(listPage.text).toContain(`action="/manage/projects/${projectId}/evidence"`);
    expect(listPage.text).toContain(`action="/manage/projects/${projectId}/skills"`);

    const resEv = await postForm(agent, csrf, '/manage/projects/' + projectId + '/evidence', { evidence_id: String(evidenceId) });
    expect(resEv.status).toBe(303);
    expect((await projectRepo.listEvidence(projectId)).length).toBe(1);

    const resSk = await postForm(agent, csrf, '/manage/projects/' + projectId + '/skills', { skill_id: String(skillId) });
    expect(resSk.status).toBe(303);
    expect((await projectRepo.listSkills(projectId)).length).toBe(1);
  });

  it('projects — form carries deploy_url and rejects an invalid URL with 400', async () => {
    const { agent, csrf } = await loginAgent(request, app);

    const newPage = await agent.get('/manage/projects/new');
    expect(newPage.text).toContain('name="deploy_url"');

    const bad = await postForm(agent, csrf, '/manage/projects', {
      title: 'Bad URL Project', deploy_url: 'not-a-url',
    });
    expect(bad.status).toBe(400);
    expect(bad.text).toContain('Must be a valid http(s) URL.');

    const ok = await postForm(agent, csrf, '/manage/projects', {
      title: 'Good URL Project', deploy_url: 'https://example.com/deploy',
    });
    expect(ok.status).toBe(303);
    const row = (await projectRepo.listAll()).find((p) => p.title === 'Good URL Project');
    expect(row.deploy_url).toBe('https://example.com/deploy');
  });
});




describe('F-02 — publish endpoints return 404 for nonexistent rows', () => {
  const app = createApp();

  it('projects publish/unpublish on unknown id returns 404', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    expect((await postForm(agent, csrf, '/manage/projects/999999/publish')).status).toBe(404);
    expect((await postForm(agent, csrf, '/manage/projects/999999/unpublish')).status).toBe(404);
  });

  it('skills publish/unpublish on unknown id returns 404', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    expect((await postForm(agent, csrf, '/manage/skills/999999/publish')).status).toBe(404);
    expect((await postForm(agent, csrf, '/manage/skills/999999/unpublish')).status).toBe(404);
  });

  it('claims publish/unpublish on unknown id returns 404', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    expect((await postForm(agent, csrf, '/manage/claims/999999/publish')).status).toBe(404);
    expect((await postForm(agent, csrf, '/manage/claims/999999/unpublish')).status).toBe(404);
  });
});

describe('F-07 — credential rotation', () => {
  const app = createApp();

  beforeEach(async () => {
    await resetTestData();
  });

  it('security page renders the rotation form with provenance (200)', async () => {
    const { agent } = await loginAgent(request, app);
    const page = await agent.get('/manage/security');
    expect(page.status).toBe(200);
    expect(page.text).toContain('name="current_password"');
    expect(page.text).toContain('name="new_password"');
    expect(page.text).toContain('Active source:');
  });

  it('rotation rejects an incorrect current password (400)', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/security/password', {
      current_password: 'totally-wrong',
      new_password: 'rotated-password-2026',
      confirm_password: 'rotated-password-2026',
    });
    expect(res.status).toBe(400);
    expect(res.text).toContain('Current password is incorrect.');
  });

  it('rotation rejects short and mismatched passwords (400)', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const short = await postForm(agent, csrf, '/manage/security/password', {
      current_password: TEST_PASSWORD, new_password: 'short', confirm_password: 'short',
    });
    expect(short.status).toBe(400);
    expect(short.text).toContain('at least 12 characters');
    const mismatch = await postForm(agent, csrf, '/manage/security/password', {
      current_password: TEST_PASSWORD, new_password: 'rotated-password-2026', confirm_password: 'different-2026',
    });
    expect(mismatch.status).toBe(400);
    expect(mismatch.text).toContain('Passwords do not match.');
  });

  it('rotation persists the new hash, supersedes the old password, and re-issues the session', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/security/password', {
      current_password: TEST_PASSWORD,
      new_password: 'rotated-password-2026',
      confirm_password: 'rotated-password-2026',
    });
    expect(res.status).toBe(303);

    // DB credential supersedes the environment bootstrap hash:
    expect(await verifyCredential('rotated-password-2026')).toBe(true);
    expect(await verifyCredential(TEST_PASSWORD)).toBe(false);

    // fresh login with the rotated credential works
    const freshAgent = request.agent(app);
    const page = await freshAgent.get('/manage/login');
    const token = /name="_csrf"\s+value="([^"]+)"/.exec(page.text)[1];
    const relogin = await freshAgent.post('/manage/login').type('form').redirects(0)
      .send({ _csrf: token, password: 'rotated-password-2026' });
    expect(relogin.status).toBe(303);

    // cleanup: restore env-bootstrap credential state for other suites
    const { query } = require('../src/config/database');
    await query('DELETE FROM owner_credential');
  });
});



