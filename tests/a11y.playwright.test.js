const { configureTestEnv } = require('./helpers');
configureTestEnv();

const { createApp } = require('../src/app');
const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

let app;
let server;
let port;

test.beforeAll(async () => {
  app = createApp();
  // Get a free port
  const net = require('net');
  const temporaryServer = net.createServer();
  await new Promise((resolve) => temporaryServer.listen(0, resolve));
  port = temporaryServer.address().port;
  temporaryServer.close();
  
  // Start the real server and wait for it to be ready
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

test('should bootstrap app and check accessibility of P0 pages', async ({ page }) => {
  const testUrls = [
    '/',
    '/projects',
    '/skills',
    '/manage/login'
  ];

  // Note: For dynamic routes like /projects/:id and /skills/:id,
  // we would need to seed data first and then test with actual IDs
  // For simplicity in this implementation, we'll test the static routes
  // and note that dynamic route testing would require seeding

  // Use playwright to test each URL
  for (const url of testUrls) {
    try {
      await page.goto('http://localhost:' + port + url, {
        waitUntil: 'networkidle'
      });
      
      // Inject axe and run accessibility check
      const axeBuilder = new AxeBuilder({ page });
      const accessibilityScanResults = await axeBuilder.analyze();
      
      // Assert that there are no accessibility violations
      expect(accessibilityScanResults.violations).toEqual([]);
    } catch (error) {
      console.error('Failed to test URL:', url, error);
      throw error;
    }
  }
});
