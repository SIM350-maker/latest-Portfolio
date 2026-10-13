'use strict';

// Final scope acceptance — certifications/references/recommendations admin
// CRUD, public CV page, and the contact form lifecycle (module I).

const { configureTestEnv, loginAgent, postForm } = require('./helpers');
configureTestEnv();

const request = require('supertest');
const { createApp } = require('../src/app');
const profileRepo = require('../src/repositories/profileRepository');
const experienceRepo = require('../src/repositories/experienceRepository');
const educationRepo = require('../src/repositories/educationRepository');
const certificationRepo = require('../src/repositories/certificationRepository');
const recommendationRepo = require('../src/repositories/recommendationRepository');
const referenceRepo = require('../src/repositories/referenceRepository');
const contactRepo = require('../src/repositories/contactRepository');

describe('certifications / references / recommendations — admin CRUD through the UI', () => {
  const app = createApp();

  beforeEach(async () => {
    // Driver-neutral cleanup: in the PostgreSQL lane these DELETEs must hit
    // PostgreSQL, not a throwaway SQLite handle.
    const { query } = require('../src/config/database');
    for (const t of ['certifications', 'cv_references', 'recommendations']) {
      await query('DELETE FROM ' + t);
    }
    if (!(await profileRepo.getProfile())) {
      await profileRepo.createProfile({ name: 'CV Owner', role: 'Engineer', summary: 'profile' });
    }
  });

  it('certifications — create, edit via disclosure, delete', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    expect((await postForm(agent, csrf, '/manage/certifications', {
      title: 'Advanced Prompt Engineering', issuer: 'Free Academy.al',
    })).status).toBe(303);
    const list1 = await agent.get('/manage/certifications');
    expect(list1.text).toContain('Advanced Prompt Engineering');

    const id = (await certificationRepo.listAll())[0].id;
    expect((await postForm(agent, csrf, '/manage/certifications/' + id, {
      title: 'Advanced Prompt Engineering II', issuer: 'Free Academy.al',
    })).status).toBe(303);
    expect((await certificationRepo.getById(id)).title).toBe('Advanced Prompt Engineering II');

    expect((await postForm(agent, csrf, '/manage/certifications/' + id + '/delete')).status).toBe(303);
    expect(await certificationRepo.getById(id)).toBeNull();
  });

  it('references — create with validation, edit, delete; private-data notice rendered', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    const page = await agent.get('/manage/references');
    expect(page.text).toContain('never rendered on the public site');

    expect((await postForm(agent, csrf, '/manage/references', {
      name: 'Mr. Alex Kekee', role: 'Senior Dev', organization: 'Intersoft',
      email: 'not-an-email', phone: '0715358400',
    })).status).toBe(400);

    expect((await postForm(agent, csrf, '/manage/references', {
      name: 'Mr. Alex Kekee', role: 'Senior Dev', organization: 'Intersoft',
      email: 'alex@intersoft.example', phone: '0715358400',
    })).status).toBe(303);
    expect((await referenceRepo.listAll()).length).toBe(1);

    const id = (await referenceRepo.listAll())[0].id;
    expect((await postForm(agent, csrf, '/manage/references/' + id, {
      name: 'Mr. Alex Kekee', role: 'Lead Dev', organization: 'Intersoft',
      email: 'alex@intersoft.example', phone: '0715358400',
    })).status).toBe(303);
    expect((await referenceRepo.getById(id)).role).toBe('Lead Dev');

    expect((await postForm(agent, csrf, '/manage/references/' + id + '/delete')).status).toBe(303);
    expect(await referenceRepo.getById(id)).toBeNull();
  });

  it('recommendations — create, edit, delete', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    expect((await postForm(agent, csrf, '/manage/recommendations', {
      title: 'Junior Mobile Developer Recommendation Letter', issuer: 'Intersoft Technologies Consulting (E.A) Ltd.',
    })).status).toBe(303);
    const id = (await recommendationRepo.listAll())[0].id;
    expect((await postForm(agent, csrf, '/manage/recommendations/' + id, {
      title: 'Updated Recommendation', issuer: 'Intersoft',
    })).status).toBe(303);
    expect((await recommendationRepo.getById(id)).title).toBe('Updated Recommendation');
    expect((await postForm(agent, csrf, '/manage/recommendations/' + id + '/delete')).status).toBe(303);
    expect(await recommendationRepo.getById(id)).toBeNull();
  });
});

describe('public CV page (FR-007 public rendering)', () => {
  const app = createApp();

  beforeEach(async () => {
    const { query } = require('../src/config/database');
    for (const t of ['certifications', 'recommendations', 'experience', 'education']) {
      await query('DELETE FROM ' + t);
    }
    if (!(await profileRepo.getProfile())) {
      await profileRepo.createProfile({ name: 'SIMON IPARA', role: 'Engineer', summary: 'summary text' });
    }
    // Deterministic identity: prior suites may have left a different profile.
    const current = await profileRepo.getProfile();
    await profileRepo.updateProfile(current.id, { name: 'SIMON IPARA', role: 'Engineer', summary: 'summary text' });
    await profileRepo.setPublicationState(current.id, 'Published');
  });

  it('renders the published CV with experience, education, certifications, recommendations', async () => {
    await experienceRepo.create({ title: 'Systems Administrator', company: 'Bright Promise School', start_date: '2026-07' });
    await educationRepo.create({ institution: 'Chuka University', degree: 'BSc', start_date: '2022-09', grade: 'Second Class Honours' });
    await certificationRepo.create({ title: 'Data Analytics Training', issuer: 'ICT Authority, Kenya' });
    await recommendationRepo.create({ title: 'Recommendation Letter', issuer: 'Intersoft' });

    const res = await request(app).get('/cv');
    expect(res.status).toBe(200);
    expect(res.text).toContain('SIMON IPARA');
    expect(res.text).toContain('Systems Administrator — Bright Promise School');
    expect(res.text).toContain('July 2026'); // formatRange view helper
    expect(res.text).toContain('Chuka University');
    expect(res.text).toContain('Second Class Honours');
    expect(res.text).toContain('Data Analytics Training');
    expect(res.text).toContain('Recommendation Letter');
  });

  it('404s when the profile is unpublished (publication gate)', async () => {
    const { query } = require('../src/config/database');
    await query('UPDATE profile SET publication_state = $1', ['Draft']);
    const res = await request(app).get('/cv');
    expect(res.status).toBe(404);
    await query('UPDATE profile SET publication_state = $1', ['Published']);
  });
});

describe('contact form lifecycle (module I)', () => {
  const app = createApp();

  beforeEach(async () => {
    const { query } = require('../src/config/database');
    await query('DELETE FROM contact_messages');
    if (!(await profileRepo.getProfile())) {
      await profileRepo.createProfile({ name: 'CV Owner', role: 'Engineer', summary: 'profile' });
    }
  });

  it('public form renders with honeypot and CSRF', async () => {
    const res = await request(app).get('/contact');
    expect(res.status).toBe(200);
    expect(res.text).toContain('name="website"'); // honeypot
    expect(res.text).toContain('name="_csrf"');
  });

  it('valid submission persists and the success banner renders', async () => {
    const agent = request.agent(app);
    const csrf = /name="_csrf"\s+value="([^"]+)"/.exec((await agent.get('/contact')).text)[1];
    const res = await agent.post('/contact').type('form').redirects(0)
      .send({ _csrf: csrf, name: 'Visitor', email: 'visitor@example.com', message: 'Hello from the probe.' });
    expect(res.status).toBe(303);
    expect((await contactRepo.listAll()).length).toBe(1);
    const page = await agent.get('/contact?submitted=1');
    expect(page.text).toContain('your message has been received');
  });

  it('invalid submissions return 400 with field errors', async () => {
    const agent = request.agent(app);
    const csrf = /name="_csrf"\s+value="([^"]+)"/.exec((await agent.get('/contact')).text)[1];
    const res = await agent.post('/contact').type('form')
      .send({ _csrf: csrf, name: '', email: 'bad', message: '' });
    expect(res.status).toBe(400);
    expect(res.text).toContain('Must be a valid email address.');
  });

  it('honeypot submissions are silently dropped', async () => {
    const agent = request.agent(app);
    const csrf = /name="_csrf"\s+value="([^"]+)"/.exec((await agent.get('/contact')).text)[1];
    const res = await agent.post('/contact').type('form').redirects(0)
      .send({ _csrf: csrf, name: 'Bot', email: 'bot@spam.example', message: 'spam', website: 'http://spam.example' });
    expect(res.status).toBe(303);
    expect((await contactRepo.listAll()).length).toBe(0);
  });

  it('admin triage: mark handled, then delete; unauthenticated access redirects', async () => {
    contactRepo.create({ name: 'Visitor', email: 'v@example.com', message: 'hi' });
    expect((await request(app).get('/manage/contact').redirects(0)).status).toBe(302);

    const { agent, csrf } = await loginAgent(request, app);
    const id = (await contactRepo.listAll())[0].id;
    expect((await postForm(agent, csrf, '/manage/contact/' + id + '/handle')).status).toBe(303);
    expect(Boolean((await contactRepo.getById(id)).handled)).toBe(true);
    expect((await postForm(agent, csrf, '/manage/contact/' + id + '/delete')).status).toBe(303);
    expect(await contactRepo.getById(id)).toBeNull();
  });
});





