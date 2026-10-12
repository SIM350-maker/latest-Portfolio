'use strict';

const { configureTestEnv, loginAgent, resetTestData } = require('./helpers');
configureTestEnv();

const request = require('supertest');
const { createApp } = require('../src/app');
const profileRepo = require('../src/repositories/profileRepository');
const skillRepo = require('../src/repositories/skillRepository');
const experienceRepo = require('../src/repositories/experienceRepository');
const educationRepo = require('../src/repositories/educationRepository');
const { query, closeDatabase } = require('../src/config/database');

describe('FR-007 — CV generation', () => {
  const app = createApp();

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await resetTestData();
    if (!(await profileRepo.getProfile())) {
        await profileRepo.createProfile({
        name: 'Ada Lovelace',
        role: 'Software Engineer',
        summary: 'Writes observable, verifiable software.',
        contact_info: 'ada@example.com',
      });
    }
  });

  it('unauthenticated GET /manage/cv redirects to login (302)', async () => {
    const res = await request(app).get('/manage/cv').redirects(0);
    expect(res.status).toBe(302);
  });

  it('CV preview renders summary, skills, experience, and education sections (200)', async () => {
    await skillRepo.create({ name: 'TypeScript', description: 'typed JS' });
    await skillRepo.create({ name: 'Hidden Skill', description: 'draft only' });
    const skill = (await skillRepo.listAll()).find((s) => s.name === 'TypeScript');
    await skillRepo.setPublicationState(skill.id, 'Published');

    await experienceRepo.create({ title: 'Engineer', company: 'Acme', start_date: '2024-01', description: 'Built things' });
    await educationRepo.create({ institution: 'State U', degree: 'BSc', start_date: '2016-09' });

    const { agent } = await loginAgent(request, app);
    const res = await agent.get('/manage/cv');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Ada Lovelace');
    expect(res.text).toContain('Professional Summary');
    expect(res.text).toContain('Writes observable, verifiable software.');
    expect(res.text).toContain('Skills');
    expect(res.text).toContain('TypeScript');
    expect(res.text).not.toContain('Hidden Skill'); // published-only honesty invariant
    expect(res.text).toContain('Professional Experience');
    expect(res.text).toContain('Engineer — Acme');
    expect(res.text).toContain('Education');
    expect(res.text).toContain('BSc — State U');
  });

  it('download endpoint serves an attachment with a sanitized filename', async () => {
    const { agent } = await loginAgent(request, app);
    const res = await agent.get('/manage/cv/download');
    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('ada-lovelace-cv.html');
  });

  it('download endpoint sanitizes unsafe filename characters', async () => {
    const profile = await profileRepo.getProfile();
    await profileRepo.updateProfile(profile.id, { name: 'Ada <Lovelace> / "Countess"' });
    const { agent } = await loginAgent(request, app);
    const res = await agent.get('/manage/cv/download');
    expect(res.headers['content-disposition']).toContain('ada-lovelace-countess-cv.html');
  });

  it('CV reflects live data: new rows appear, deleted rows disappear', async () => {
    const { agent } = await loginAgent(request, app);
    const id = await experienceRepo.create({ title: 'Temp Role', company: 'Temp Co', start_date: '2020-01' });

    const withRow = await agent.get('/manage/cv');
    expect(withRow.text).toContain('Temp Role — Temp Co');

    await experienceRepo.remove(id);
    const withoutRow = await agent.get('/manage/cv');
    expect(withoutRow.text).not.toContain('Temp Role — Temp Co');
  });

  it('no profile yet renders an empty-state CV without crashing', async () => {
    await query('DELETE FROM profile');
    const { agent } = await loginAgent(request, app);
    const res = await agent.get('/manage/cv');
    expect(res.status).toBe(200);
    expect(res.text).toContain('No profile created yet');
  });
});




