'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startServer } = require('./helpers');

describe('Authentication & profile', () => {
  let api;
  before(async () => { api = await startServer(); });
  after(async () => { await api.close(); });

  const creds = { name: 'Muhsin', email: 'Muhsin@Example.com', password: 'password123' };
  let token;

  it('registers a user (201) without exposing the password hash', async () => {
    const res = await api.call('POST', '/api/auth/register', { body: creds });
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, 'muhsin@example.com'); // normalised to lowercase
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.user.passwordHash, undefined);
  });

  it('stores a bcrypt hash, never the plain-text password', () => {
    const users = JSON.parse(fs.readFileSync(path.join(api.dataDir, 'users.json'), 'utf8'));
    assert.equal(users.length, 1);
    assert.match(users[0].passwordHash, /^\$2[aby]\$/);
    assert.ok(!JSON.stringify(users).includes('password123'));
  });

  it('rejects a duplicate email (409)', async () => {
    const res = await api.call('POST', '/api/auth/register', { body: creds });
    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'EMAIL_TAKEN');
  });

  it('validates the registration body (400 + details)', async () => {
    const res = await api.call('POST', '/api/auth/register', { body: { name: 'A', email: 'nope', password: '123' } });
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.ok(res.body.error.details.length >= 3);
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await api.callRaw('POST', '/api/auth/login', '{"email": ');
    assert.equal(res.status, 400);
    assert.equal(res.body.error.code, 'INVALID_JSON');
  });

  it('logs in with correct credentials (200)', async () => {
    const res = await api.call('POST', '/api/auth/login', { body: { email: 'muhsin@example.com', password: 'password123' } });
    assert.equal(res.status, 200);
    token = res.body.data.token;
    assert.ok(token);
  });

  it('rejects a wrong password and unknown email with the same 401', async () => {
    const wrong = await api.call('POST', '/api/auth/login', { body: { email: 'muhsin@example.com', password: 'wrongpass1' } });
    const unknown = await api.call('POST', '/api/auth/login', { body: { email: 'who@example.com', password: 'password123' } });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.error.message, unknown.body.error.message);
  });

  it('GET /api/auth/me returns the current user with a valid token', async () => {
    const res = await api.call('GET', '/api/auth/me', { token });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.email, 'muhsin@example.com');
  });

  it('protected routes need a valid token (401)', async () => {
    assert.equal((await api.call('GET', '/api/auth/me')).status, 401);
    assert.equal((await api.call('GET', '/api/tasks', { token: 'garbage.token.value' })).status, 401);
    assert.equal((await api.call('GET', '/api/projects')).status, 401);
  });

  it('updates the profile; changing the password needs the current one', async () => {
    const ok = await api.call('PATCH', '/api/users/me', { token, body: { name: 'Muhammed Muhsin' } });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.data.name, 'Muhammed Muhsin');

    const missing = await api.call('PATCH', '/api/users/me', { token, body: { password: 'newpassword1' } });
    assert.equal(missing.status, 400);

    const wrong = await api.call('PATCH', '/api/users/me', { token, body: { password: 'newpassword1', currentPassword: 'bad-one-123' } });
    assert.equal(wrong.status, 400);

    const good = await api.call('PATCH', '/api/users/me', { token, body: { password: 'newpassword1', currentPassword: 'password123' } });
    assert.equal(good.status, 200);
    const relog = await api.call('POST', '/api/auth/login', { body: { email: 'muhsin@example.com', password: 'newpassword1' } });
    assert.equal(relog.status, 200);
  });

  it('logout revokes the token', async () => {
    const out = await api.call('POST', '/api/auth/logout', { token });
    assert.equal(out.status, 200);
    const after = await api.call('GET', '/api/auth/me', { token });
    assert.equal(after.status, 401);
  });

  it('unknown routes return a JSON 404', async () => {
    const res = await api.call('GET', '/api/nothing-here');
    assert.equal(res.status, 404);
    assert.equal(res.body.error.code, 'ROUTE_NOT_FOUND');
  });
});