const { configureTestEnv, TEST_PASSWORD } = require('./helpers');
configureTestEnv();

const { createApp } = require('../src/app');
const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

let app;
let server;
let port;
let baseUrl;

test.beforeAll(async () => {
  app = createApp();
  const net = require('net');
  const temporaryServer = net.createServer();
  await new Promise((resolve) => temporaryServer.listen(0, resolve));
  port = temporaryServer.address().port;
  temporaryServer.close();
  baseUrl = 'http://localhost:' + port;

  await new Promise((resolve, reject) => {
    server = app.listen(port);
    server.on('listening', resolve);
    server.on('error', reject);
  });
});

test.afterAll(async () => {
  if (server) {
    server.close();
  }
});

/** Sign in through the real login form so authenticated pages can be scanned. */
async function login(page) {
  await page.goto(baseUrl + '/manage/login', { waitUntil: 'networkidle' });
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await Promise.all([
    page.waitForURL('**/manage'),
    page.click('button[type="submit"]'),
  ]);
}

async function expectNoViolations(page, url) {
  await page.goto(baseUrl + url, { waitUntil: 'networkidle' });
  const results = await new AxeBuilder({ page }).analyze();
  const report = results.violations
    .map((v) => v.id + ' [' + v.impact + '] ' + v.nodes.length + ' node(s) on ' + url)
    .join('\n');
  expect(report, 'axe violations on ' + url).toBe('');
}

test('public P0 pages have no accessibility violations', async ({ page }) => {
  const publicPages = ['/', '/projects', '/skills', '/manage/login'];
  for (const url of publicPages) {
    await expectNoViolations(page, url);
  }
});

test('authenticated manage pages have no accessibility violations', async ({ page }) => {
  await login(page);
  const managePages = [
    '/manage',
    '/manage/profile',
    '/manage/projects',
    '/manage/projects/new',
    '/manage/skills',
    '/manage/claims',
    '/manage/evidence',
    '/manage/experience',
    '/manage/education',
    '/manage/cv',
  ];
  for (const url of managePages) {
    await expectNoViolations(page, url);
  }
});

test('CV print button triggers window.print through the external script (F-01)', async ({ page }) => {
  await page.addInitScript(() => {
    window.__printed = false;
    window.print = () => { window.__printed = true; };
  });
  await login(page);
  await page.goto(baseUrl + '/manage/cv', { waitUntil: 'networkidle' });
  // CSP (script-src-attr: none) must not block the externally-wired listener
  await page.click('#print-cv');
  const printed = await page.evaluate(() => window.__printed);
  expect(printed).toBe(true);
});
