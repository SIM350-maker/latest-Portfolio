'use strict';

const { configureTestEnv, loginAgent, extractCsrf, postForm, resetTestData } = require('./helpers');
configureTestEnv();

const request = require('supertest');
const { createApp } = require('../src/app');
const experienceRepo = require('../src/repositories/experienceRepository');
const educationRepo = require('../src/repositories/educationRepository');
const profileRepo = require('../src/repositories/profileRepository');
const { closeDatabase } = require('../src/config/database');

describe('MOD-013 — Experience & Education management', () => {
  const app = createApp();

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await resetTestData();
    if (!(await profileRepo.getProfile())) {
      await profileRepo.createProfile({ name: 'Test Owner', role: 'Engineer', summary: 'Test profile', contact_info: null });
    }
  });

  // ---------------------------------------------------------- experience CRUD
  it('experience — POST /manage/experience creates a row and lists it (200)', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/experience', {
      title: 'Software Engineer', company: 'Acme Corp',
      start_date: '2024-01', end_date: '', description: 'Built things',
    });
    expect(res.status).toBe(303);
    const rows = await experienceRepo.listAll();
    expect(rows.length).toBe(1);
    expect(rows[0].title).toBe('Software Engineer');
    expect(rows[0].company).toBe('Acme Corp');
    const page = await agent.get('/manage/experience');
    expect(page.status).toBe(200);
    expect(page.text).toContain('Software Engineer');
  });

  it('experience — create with missing required fields returns 400 and renders errors', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/experience', { title: '', company: '', start_date: '' });
    expect(res.status).toBe(400);
    expect(res.text).toContain('Title');
    expect((await experienceRepo.listAll()).length).toBe(0);
  });

  it('experience — POST /manage/experience/:id updates the row', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const id = await experienceRepo.create({ title: 'Junior Dev', company: 'Beta LLC', start_date: '2020-01' });
    const res = await postForm(agent, csrf, '/manage/experience/' + id, {
      title: 'Senior Dev', company: 'Beta LLC', start_date: '2020-01', end_date: '', description: 'Promoted',
    });
    expect(res.status).toBe(303);
    const row = await experienceRepo.getById(id);
    expect(row.title).toBe('Senior Dev');
    expect(row.description).toBe('Promoted');
  });

  it('experience — update unknown id returns 404', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/experience/999999', {
      title: 'X', company: 'Y', start_date: '2020-01',
    });
    expect(res.status).toBe(404);
  });

  it('experience — delete removes the row; unknown id returns 404', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const id = await experienceRepo.create({ title: 'Temp', company: 'Temp Co', start_date: '2019-01' });
    const res = await postForm(agent, csrf, '/manage/experience/' + id + '/delete');
    expect(res.status).toBe(303);
    expect(await experienceRepo.getById(id)).toBeNull();
    const res404 = await postForm(agent, csrf, '/manage/experience/999999/delete');
    expect(res404.status).toBe(404);
  });

  // ---------------------------------------------------------- education CRUD
  it('education — POST /manage/education creates a row and lists it (200)', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/education', {
      institution: 'State University', degree: 'BSc Computer Science',
      field_of_study: 'Computer Science', start_date: '2016-09', end_date: '2020-06', description: '',
    });
    expect(res.status).toBe(303);
    const rows = await educationRepo.listAll();
    expect(rows.length).toBe(1);
    expect(rows[0].institution).toBe('State University');
    const page = await agent.get('/manage/education');
    expect(page.status).toBe(200);
    expect(page.text).toContain('State University');
  });

  it('education — create with missing required fields returns 400 and renders errors', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/education', { institution: '', degree: '', start_date: '' });
    expect(res.status).toBe(400);
    expect(res.text).toContain('Institution');
    expect((await educationRepo.listAll()).length).toBe(0);
  });

  it('education — POST /manage/education/:id updates the row', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const id = await educationRepo.create({ institution: 'Old College', degree: 'BA', start_date: '2012-09' });
    const res = await postForm(agent, csrf, '/manage/education/' + id, {
      institution: 'New College', degree: 'MSc', field_of_study: 'HCI',
      start_date: '2021-09', end_date: '', description: '',
    });
    expect(res.status).toBe(303);
    const row = await educationRepo.getById(id);
    expect(row.institution).toBe('New College');
    expect(row.degree).toBe('MSc');
  });

  it('education — update unknown id returns 404', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const res = await postForm(agent, csrf, '/manage/education/999999', {
      institution: 'X', degree: 'Y', start_date: '2020-01',
    });
    expect(res.status).toBe(404);
  });

  it('education — delete removes the row; unknown id returns 404', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const id = await educationRepo.create({ institution: 'Temp U', degree: 'PhD', start_date: '2018-01' });
    const res = await postForm(agent, csrf, '/manage/education/' + id + '/delete');
    expect(res.status).toBe(303);
    expect(await educationRepo.getById(id)).toBeNull();
    const res404 = await postForm(agent, csrf, '/manage/education/999999/delete');
    expect(res404.status).toBe(404);
  });

  // ---------------------------------------------------------- auth & CSRF
  it('unauthenticated GET /manage/experience redirects to login (302)', async () => {
    const res = await request(app).get('/manage/experience').redirects(0);
    expect(res.status).toBe(302);
  });

  it('unauthenticated GET /manage/education redirects to login (302)', async () => {
    const res = await request(app).get('/manage/education').redirects(0);
    expect(res.status).toBe(302);
  });

  it('POST without CSRF token returns 403', async () => {
    const { agent } = await loginAgent(request, app);
    const resExp = await agent.post('/manage/experience').type('form').redirects(0).send({
      title: 'T', company: 'C', start_date: '2020-01',
    });
    expect(resExp.status).toBe(403);
    const resEdu = await agent.post('/manage/education').type('form').redirects(0).send({
      institution: 'I', degree: 'D', start_date: '2020-01',
    });
    expect(resEdu.status).toBe(403);
  });

  // ---------------------------------------------------------- dashboard
  it('dashboard shows experience and education counts', async () => {
    const { agent } = await loginAgent(request, app);
    await experienceRepo.create({ title: 'Role', company: 'Co', start_date: '2020-01' });
    await educationRepo.create({ institution: 'U', degree: 'BSc', start_date: '2016-09' });
    const page = await agent.get('/manage');
    expect(page.status).toBe(200);
    expect(page.text).toContain('Experience entries');
    expect(page.text).toContain('Education entries');
  });

  it('CSRF token from login page can be extracted for new sections (regression)', async () => {
    const { agent } = await loginAgent(request, app);
    const exp = await agent.get('/manage/experience');
    const edu = await agent.get('/manage/education');
    expect(extractCsrf(exp.text)).toBeTruthy();
    expect(extractCsrf(edu.text)).toBeTruthy();
  });
});



