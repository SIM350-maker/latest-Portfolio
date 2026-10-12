'use strict';

const { configureTestEnv, loginAgent, postForm, resetTestData } = require('./helpers');
configureTestEnv();

const request = require('supertest');
const { createApp } = require('../src/app');
const { closeDatabase } = require('../src/config/database');
const profileRepo = require('../src/repositories/profileRepository');
const { ConflictError } = require('../src/lib/validation');

describe('Data constraints and referential integrity', () => {
  const app = createApp();

  beforeEach(async () => {
    await resetTestData();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it('enforces the profile singleton (DEF-001 fix): second create fails with ConflictError', async () => {
    await profileRepo.createProfile({ name: 'A', role: 'R', summary: 'S' });
    await expect(profileRepo.createProfile({ name: 'B', role: 'R', summary: 'S' })).rejects.toThrow(ConflictError);
    const { all: dbAll } = require('../src/config/database');
    const countRows = await dbAll('SELECT COUNT(*) AS n FROM profile');
    expect(Number(countRows[0].n)).toBe(1);
  });

  it('blocks project deletion while claims reference it (409), allows it after claim removal', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    await postForm(agent, csrf, '/manage/projects', { title: 'Restricted Project' });
    const listPage = await agent.get('/manage/projects');
    const projectId = /\/manage\/projects\/(\d+)\/publish/.exec(listPage.text)[1];

    await postForm(agent, csrf, '/manage/claims', { statement: 'Claim on project', source_entity_type: 'project', source_entity_id: projectId });
    const claimsPage = await agent.get('/manage/claims');
    const claimId = /\/manage\/claims\/(\d+)\/publish/.exec(claimsPage.text)[1];

    const blocked = await postForm(agent, csrf, '/manage/projects/' + projectId + '/delete');
    expect(blocked.status).toBe(409);

    // Deleting the claim cascades only its evidence links (none), then project delete succeeds.
    const claimDeleted = await postForm(agent, csrf, '/manage/claims/' + claimId + '/delete');
    expect(claimDeleted.status).toBe(303);
    const deleted = await postForm(agent, csrf, '/manage/projects/' + projectId + '/delete');
    expect(deleted.status).toBe(303);
  });

  it('cascades claim deletion to claim-evidence links but keeps evidence rows', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    await postForm(agent, csrf, '/manage/evidence', {
      description: 'Load test report',
      file_path: 'https://example.com/report',
      file_type: 'document',
    });
    await postForm(agent, csrf, '/manage/claims', { statement: 'Handles 10k rps' });

    const claimsPage = await agent.get('/manage/claims');
    const claimId = /\/manage\/claims\/(\d+)\/publish/.exec(claimsPage.text)[1];
    const evidencePage = await agent.get('/manage/evidence');
    const evidenceId = /\/manage\/evidence\/(\d+)\/accessibility/.exec(evidencePage.text)[1];

    await postForm(agent, csrf, '/manage/claims/' + claimId + '/evidence', { evidence_id: evidenceId });
    let claimEvidence = await require('../src/repositories/claimRepository').listEvidence(Number(claimId));
    expect(claimEvidence).toHaveLength(1);

    await postForm(agent, csrf, '/manage/claims/' + claimId + '/delete');
    claimEvidence = await require('../src/repositories/claimRepository').listEvidence(Number(claimId));
    expect(claimEvidence).toHaveLength(0);
    // The evidence row itself survives (cascade touches links only).
    expect(await require('../src/repositories/evidenceRepository').getById(Number(evidenceId))).not.toBeNull();
  });

  it('validates evidence reference URLs and accessibility enum (FR-006)', async () => {
    const { agent, csrf } = await loginAgent(request, app);

    const badUrl = await postForm(agent, csrf, '/manage/evidence', { description: 'x', file_path: 'not-a-url' });
    expect(badUrl.status).toBe(400);
    expect(badUrl.text).toContain('valid http(s) URL');

    await postForm(agent, csrf, '/manage/evidence', { description: 'Repo link', file_path: 'https://github.com/example/repo' });
    const evidencePage = await agent.get('/manage/evidence');
    const evidenceId = /\/manage\/evidence\/(\d+)\/accessibility/.exec(evidencePage.text)[1];

    const invalid = await postForm(agent, csrf, '/manage/evidence/' + evidenceId + '/accessibility', { accessibility_status: 'SortOfPublic' });
    expect(invalid.status).toBe(400);

    const ok = await postForm(agent, csrf, '/manage/evidence/' + evidenceId + '/accessibility', { accessibility_status: 'Private/Restricted' });
    expect(ok.status).toBe(303);
  });

  it('renders evidence accessibility honestly on public pages (honesty invariant)', async () => {
    const { agent, csrf } = await loginAgent(request, app);
    await postForm(agent, csrf, '/manage/projects', { title: 'Honesty Project' });
    const listPage = await agent.get('/manage/projects');
    const projectId = /\/manage\/projects\/(\d+)\/publish/.exec(listPage.text)[1];
    await postForm(agent, csrf, '/manage/projects/' + projectId + '/publish');

    await postForm(agent, csrf, '/manage/evidence', { description: 'Secret architecture doc', file_path: 'https://example.com/secret.pdf' });
    const evidencePage = await agent.get('/manage/evidence');
    const evidenceId = /\/manage\/evidence\/(\d+)\/accessibility/.exec(evidencePage.text)[1];
    await postForm(agent, csrf, '/manage/evidence/' + evidenceId + '/accessibility', { accessibility_status: 'Unavailable' });
    await postForm(agent, csrf, '/manage/projects/' + projectId + '/evidence', { evidence_id: evidenceId });

    const detail = await request(app).get('/projects/' + projectId);
    expect(detail.text).toContain('Access: Unavailable');
    // Non-public evidence must not render as a verifiable link.
    expect(detail.text).not.toContain('href="https://example.com/secret.pdf"');
    expect(detail.text).toContain('not publicly accessible');
  });
});



