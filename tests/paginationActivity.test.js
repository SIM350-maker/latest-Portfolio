'use strict';

// Stage 9 — pagination, search, and audit activity surface.

const { configureTestEnv, loginAgent, postForm, resetTestData } = require('./helpers');
configureTestEnv();

const request = require('supertest');
const { createApp } = require('../src/app');
const skillRepo = require('../src/repositories/skillRepository');
const profileRepo = require('../src/repositories/profileRepository');

describe('Stage 9 — pagination and search', () => {
  const app = createApp();

  beforeEach(async () => {
    await resetTestData();
    if (!(await profileRepo.getProfile())) {
      await profileRepo.createProfile({ name: 'Pager Owner', role: 'Engineer', summary: 'profile', contact_info: null });
    }
  });

  it('skills list paginates at 20 per page with a stable name ordering', async () => {
    for (let i = 1; i <= 25; i++) {
      await skillRepo.create({ name: 'Skill ' + String(i).padStart(2, '0'), category: 'Programming' });
    }
    const { agent } = await loginAgent(request, app);
    const page1 = await agent.get('/manage/skills');
    const page2 = await agent.get('/manage/skills?page=2');

    expect((page1.text.match(/<li class="manage-item">/g) || []).length).toBe(20);
    expect((page2.text.match(/<li class="manage-item">/g) || []).length).toBe(5);
    expect(page1.text).toContain('25 records'); // pagination summary
    expect(page1.text).toContain('Skill 01');   // stable ORDER BY name
    expect(page2.text).toContain('Skill 21');
    expect(page1.text).toContain('page 1 of 2');
  });

  it('search filters the skills list and preserves the term in pagination links', async () => {
    await skillRepo.create({ name: 'Alpha Unique Skill', category: 'Programming' });
    await skillRepo.create({ name: 'Beta Filler', category: 'Other' });
    const { agent } = await loginAgent(request, app);

    const results = await agent.get('/manage/skills?q=alpha');
    expect(results.text).toContain('Alpha Unique Skill');
    expect(results.text).not.toContain('Beta Filler');
    expect(results.text).toContain('matching "alpha"');

    // escaping: a wildcard-only term must not match everything
    await skillRepo.create({ name: 'Gamma Exact', category: 'Other' });
    const wildcard = await agent.get('/manage/skills?q=%25');
    expect(wildcard.text).not.toContain('Alpha Unique Skill');
  });

  it('project search spans title and technologies', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    await postForm(agent, csrf, '/manage/projects', {
      title: 'Observable Pipeline', technologies: 'PostgreSQL, Prisma',
    });
    await postForm(agent, csrf, '/manage/projects', {
      title: 'Unrelated Effort', technologies: 'Canvas',
    });

    const hit = await agent.get('/manage/projects?q=prisma');
    expect(hit.text).toContain('Observable Pipeline');
    expect(hit.text).not.toContain('Unrelated Effort');
  });
});

describe('Stage 9 — audit activity surface (F-06)', () => {
  const app = createApp();

  beforeEach(async () => {
    await resetTestData();
    if (!(await profileRepo.getProfile())) {
      await profileRepo.createProfile({ name: 'Activity Owner', role: 'Engineer', summary: 'profile', contact_info: null });
    }
  });

  it('records mutations into the audit trail and renders them on /manage/activity', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    await postForm(agent, csrf, '/manage/skills', {
      name: 'Audited Skill', category: 'Engineering',
    });

    const page = await agent.get('/manage/activity');
    expect(page.status).toBe(200);
    expect(page.text).toContain('INSERT · skill');
    expect(page.text).toMatch(/by (owner|system)/); // sqlite audit triggers omit changed_by
    expect(page.text).toContain('Append-only audit trail');
  });

  it('dashboard surfaces recent audit entries', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    await postForm(agent, csrf, '/manage/skills', { name: 'Dashboard Probe Skill' });

    const dash = await agent.get('/manage');
    expect(dash.text).toContain('Recent activity');
    expect(dash.text).toContain('Dashboard Probe Skill');
    expect(dash.text).toContain('/manage/activity');
  });
});





