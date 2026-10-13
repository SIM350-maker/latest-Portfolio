'use strict';
const { configureTestEnv, loginAgent, postForm } = require('../../tests/helpers');
configureTestEnv();
const request = require('supertest');
const { createApp } = require('../../src/app');
const profileRepo = require('../../src/repositories/profileRepository');

(async () => {
  const app = createApp();
  const { agent, csrf } = await loginAgent(request, app);
  if (!profileRepo.getProfile) console.log('profileRepo.getProfile missing');
  if (!(await profileRepo.getProfile())) {
    await profileRepo.createProfile({ name: 'Debug Owner', role: 'Eng', summary: 's' });
  }
  const created = await postForm(agent, csrf, '/manage/projects', { title: 'Debug Publish Probe' });
  console.log('create status:', created.status);
  const listPage = await agent.get('/manage/projects');
  console.log('list status:', listPage.status);
  const m = /\/manage\/projects\/(\d+)\/publish/.exec(listPage.text);
  console.log('publish link match:', m ? m[1] : 'NONE');
  const i = listPage.text.indexOf('Debug Publish Probe');
  console.log('row found at index:', i);
  if (i >= 0) console.log(listPage.text.slice(Math.max(0, i - 300), i + 800).replace(/\s+/g, ' '));
  else console.log(listPage.text.slice(0, 1200).replace(/\s+/g, ' '));
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
