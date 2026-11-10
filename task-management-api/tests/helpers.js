'use strict';
// Test setup: point the app at a throw-away temp directory BEFORE loading it,
// so tests never touch the real src/data files.
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'task-api-test-'));
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-automated-tests';
process.env.DATA_DIR = path.join(tmp, 'data');
process.env.EXPORT_DIR = path.join(tmp, 'exports');
process.env.BCRYPT_ROUNDS = '4';

const app = require('../src/app');

async function startServer() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  async function call(method, url, { token, body } = {}) {
    const res = await fetch(base + url, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    return { status: res.status, body: json, text, headers: res.headers };
  }

  async function callRaw(method, url, rawBody) {
    const res = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json' }, body: rawBody });
    return { status: res.status, body: await res.json() };
  }

  async function registerUser(name, email = `${name.toLowerCase()}@example.com`) {
    const res = await call('POST', '/api/auth/register', { body: { name, email, password: 'password123' } });
    return { token: res.body.data.token, user: res.body.data.user };
  }

  const close = () =>
    new Promise((resolve) => {
      server.closeAllConnections?.();
      server.close(resolve);
    });

  return { call, callRaw, registerUser, close, dataDir: process.env.DATA_DIR, exportDir: process.env.EXPORT_DIR };
}

module.exports = { startServer };