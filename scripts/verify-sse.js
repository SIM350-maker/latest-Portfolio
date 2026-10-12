'use strict';

// Deterministic SSE verification: subscribe to /manage/events as an
// authenticated session, trigger a mutation, assert the event arrives.

const http = require('http');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const PORT = process.env.PORT || '3100';
const TEST_PASSWORD = process.env.VERIFY_PASSWORD; // set alongside the running server's hash

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { headers }, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.end();
  });
}

function postForm(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(body).toString();
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data), ...headers },
    }, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function cookieFrom(setCookieHeader) {
  return (setCookieHeader || []).map((c) => c.split(';')[0]).join('; ');
}

async function main() {
  if (!TEST_PASSWORD) {
    console.error('Set VERIFY_PASSWORD (the management password of the running server).');
    process.exit(1);
  }
  const base = 'http://localhost:' + PORT;

  // 1. login (CSRF + session rotation): the token binds to the PRE-login
  // session, so its cookie must be carried through the POST.
  const loginPage = await get(base + '/manage/login');
  const csrf = /name="_csrf"\s+value="([^"]+)"/.exec(loginPage.body)[1];
  const preLoginCookie = cookieFrom(loginPage.headers['set-cookie']);
  const login = await postForm(base + '/manage/login', { _csrf: csrf, password: TEST_PASSWORD }, { Cookie: preLoginCookie });
  if (login.status !== 303) throw new Error('login failed: ' + login.status);
  const cookie = cookieFrom(login.headers['set-cookie']);
  console.log('PASS  authenticated session established');

  // 2. open the SSE stream, collect for up to 8s
  const events = [];
  const streamPromise = new Promise((resolve) => {
    const req = http.get(base + '/manage/events', { headers: { Cookie: cookie } }, (res) => {
      console.log('PASS  SSE stream opened: ' + res.statusCode + ' ' + res.headers['content-type']);
      res.on('data', (d) => {
        const text = d.toString('utf8');
        for (const line of text.split('\n')) {
          if (line.startsWith('data: ')) {
            try { events.push(JSON.parse(line.slice(6))); } catch (_) { /* ignore */ }
          }
        }
      });
      res.on('end', resolve);
      res.on('error', resolve);
    });
    req.on('error', () => resolve());
  });

  // 3. trigger a mutation (profile publish toggle) after the stream is open
  await new Promise((r) => setTimeout(r, 1200));
  const profilePage = await get(base + '/manage/profile', { Cookie: cookie });
  const csrf2 = /name="_csrf"\s+value="([^"]+)"/.exec(profilePage.body)[1];
  const target = profilePage.body.includes('publication_state') && /Draft/.test(profilePage.body) ? 'Published' : 'Published';
  const mut = await postForm(base + '/manage/profile/publish', { _csrf: csrf2 }, { Cookie: cookie });
  console.log('PASS  mutation POST: ' + mut.status);

  // 4. wait for the event
  const arrived = await Promise.race([
    (async () => { while (events.length === 0) await new Promise((r) => setTimeout(r, 150)); return true; })(),
    new Promise((r) => setTimeout(() => r(false), 6000)),
  ]);
  if (!arrived) throw new Error('no data-changed event received within 6s');
  console.log('PASS  data-changed event received: ' + JSON.stringify(events[events.length - 1]));

  // 5. close the stream
  setTimeout(() => process.exit(0), 200);
}

main().catch((err) => { console.error('FATAL: ' + (err && err.message)); process.exit(1); });
