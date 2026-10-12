'use strict';

const { configureTestEnv, loginAgent, postForm, resetTestData } = require('./helpers');
configureTestEnv();

const request = require('supertest');
const { createApp } = require('../src/app');
const { closeDatabase } = require('../src/config/database');

describe('Publication-state isolation (public sees Published only)', () => {
  const app = createApp();

  beforeEach(async () => {
    await resetTestData();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('hides draft projects from the public site, shows them after publish, hides them after unpublish', async () => {
    const { agent, csrf } = await loginAgent(request, app);

    const created = await postForm(agent, csrf, '/manage/projects', {
      title: 'Evidence-Traceable Widget',
      description: 'A project that starts as a draft.',
      technologies: 'Node.js',
    });
    expect(created.status).toBe(303);
    expect(created.headers.location).toBe('/manage/projects');

    // Draft: not publicly visible.
    let list = await request(app).get('/projects');
    expect(list.status).toBe(200);
    expect(list.text).not.toContain('Evidence-Traceable Widget');

    // Publish via the management action.
    const listPage = await agent.get('/manage/projects');
    const idMatch = /\/manage\/projects\/(\d+)\/publish/.exec(listPage.text);
    expect(idMatch).not.toBeNull();
    const projectId = idMatch[1];
    const published = await postForm(agent, csrf, '/manage/projects/' + projectId + '/publish');
    expect(published.status).toBe(303);

    list = await request(app).get('/projects');
    expect(list.text).toContain('Evidence-Traceable Widget');

    // Detail page is publicly reachable.
    const detail = await request(app).get('/projects/' + projectId);
    expect(detail.status).toBe(200);
    expect(detail.text).toContain('A project that starts as a draft.');

    // Unpublish reverts to Draft and disappears again.
    const unpublished = await postForm(agent, csrf, '/manage/projects/' + projectId + '/unpublish');
    expect(unpublished.status).toBe(303);
    list = await request(app).get('/projects');
    expect(list.text).not.toContain('Evidence-Traceable Widget');
    const hiddenDetail = await request(app).get('/projects/' + projectId);
    expect(hiddenDetail.status).toBe(404);
  });

  it('hides draft skills from the public site until published', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    await postForm(agent, csrf, '/manage/skills', { name: 'Rust Systems Programming' });

    let list = await request(app).get('/skills');
    expect(list.text).not.toContain('Rust Systems Programming');

    const manageList = await agent.get('/manage/skills');
    const idMatch = /\/manage\/skills\/(\d+)\/publish/.exec(manageList.text);
    expect(idMatch).not.toBeNull();
    await postForm(agent, csrf, '/manage/skills/' + idMatch[1] + '/publish');

    list = await request(app).get('/skills');
    expect(list.text).toContain('Rust Systems Programming');
  });

  it('blocks public state changes with 405 (GET-only public boundary)', async () => {
    const res = await request(app).post('/projects').send({ title: 'x' });
    expect(res.status).toBe(405);
  });
});



