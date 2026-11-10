'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startServer } = require('./helpers');

describe('Projects & tasks', () => {
  let api, alice, bob, project, task;
  before(async () => {
    api = await startServer();
    alice = await api.registerUser('Alice');
    bob = await api.registerUser('Bob');
  });
  after(async () => { await api.close(); });

  const newTask = (extra = {}) => api.call('POST', '/api/tasks', { token: alice.token, body: { title: 'Task', projectId: project.id, ...extra } });

  it('creates and lists projects with pagination', async () => {
    const res = await api.call('POST', '/api/projects', { token: alice.token, body: { name: 'Website', description: 'Redesign' } });
    assert.equal(res.status, 201);
    project = res.body.data;
    assert.equal(project.ownerId, alice.user.id);

    await api.call('POST', '/api/projects', { token: alice.token, body: { name: 'Mobile app' } });
    const list = await api.call('GET', '/api/projects?limit=1&page=2&sortBy=name&order=asc', { token: alice.token });
    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.meta.total, 2);
    assert.equal(list.body.meta.totalPages, 2);
    assert.equal(list.body.meta.links.prev, '/api/projects?limit=1&page=1&sortBy=name&order=asc');
    assert.equal(list.body.meta.links.next, null);
  });

  it('creates a task with defaults, and validates input', async () => {
    const res = await newTask({ title: 'Design homepage', priority: 'high', dueDate: '2026-12-01' });
    assert.equal(res.status, 201);
    task = res.body.data;
    assert.equal(task.status, 'todo');
    assert.equal(task.priority, 'high');
    assert.equal(task.dueDate, '2026-12-01T00:00:00.000Z');
    assert.equal(task.assigneeId, null);

    assert.equal((await newTask({ title: '' })).status, 400);
    assert.equal((await newTask({ priority: 'urgent' })).status, 400);
    assert.equal((await newTask({ dueDate: 'not-a-date' })).status, 400);
    assert.equal((await newTask({ projectId: 'abc' })).status, 400);
  });

  it('filters by status, priority and due date, and sorts', async () => {
    await newTask({ title: 'Write copy', priority: 'low', dueDate: '2026-11-10', status: 'in_progress' });
    await newTask({ title: 'Deploy', priority: 'medium', dueDate: '2026-12-25', status: 'done' });
    await newTask({ title: 'No due date', priority: 'medium' });

    const get = async (q) => (await api.call('GET', `/api/tasks?${q}`, { token: alice.token })).body;

    assert.deepEqual((await get('status=done')).data.map((t) => t.title), ['Deploy']);
    assert.deepEqual((await get('priority=high')).data.map((t) => t.title), ['Design homepage']);
    assert.deepEqual((await get('dueBefore=2026-11-30')).data.map((t) => t.title), ['Write copy']);
    assert.deepEqual((await get('dueAfter=2026-12-01&sortBy=dueDate&order=asc')).data.map((t) => t.title), ['Design homepage', 'Deploy']);
    assert.deepEqual((await get('sortBy=priority&order=desc&limit=2')).data.map((t) => t.priority), ['high', 'medium']);
    // tasks with no due date always go last
    assert.equal((await get('sortBy=dueDate&order=asc')).data.at(-1).title, 'No due date');

    const page = await get('limit=2&page=2&sortBy=title&order=asc');
    assert.equal(page.meta.total, 4);
    assert.equal(page.data.length, 2);
    assert.equal((await api.call('GET', '/api/tasks?limit=1000', { token: alice.token })).status, 400);
    assert.equal((await api.call('GET', '/api/tasks?sortBy=password', { token: alice.token })).status, 400);
  });

  it('keeps other users out of projects and tasks (403 / hidden)', async () => {
    assert.equal((await api.call('GET', `/api/projects/${project.id}`, { token: bob.token })).status, 403);
    assert.equal((await api.call('PATCH', `/api/projects/${project.id}`, { token: bob.token, body: { name: 'Hacked' } })).status, 403);
    assert.equal((await api.call('DELETE', `/api/projects/${project.id}`, { token: bob.token })).status, 403);
    assert.equal((await api.call('GET', `/api/tasks/${task.id}`, { token: bob.token })).status, 403);
    assert.equal((await api.call('DELETE', `/api/tasks/${task.id}`, { token: bob.token })).status, 403);
    assert.equal((await api.call('POST', '/api/tasks', { token: bob.token, body: { title: 'x', projectId: project.id } })).status, 403);
    assert.equal((await api.call('GET', '/api/tasks', { token: bob.token })).body.meta.total, 0);
    assert.equal((await api.call('GET', `/api/tasks/${crypto.randomUUID()}`, { token: alice.token })).status, 404);
  });

  it('assigns a task; the assignee can see it and change only its status', async () => {
    const bad = await api.call('PATCH', `/api/tasks/${task.id}/assign`, { token: alice.token, body: { assigneeId: crypto.randomUUID() } });
    assert.equal(bad.status, 400);

    const res = await api.call('PATCH', `/api/tasks/${task.id}/assign`, { token: alice.token, body: { assigneeId: bob.user.id } });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.assigneeId, bob.user.id);

    assert.equal((await api.call('GET', `/api/tasks/${task.id}`, { token: bob.token })).status, 200);
    assert.equal((await api.call('GET', '/api/tasks', { token: bob.token })).body.meta.total, 1);

    const status = await api.call('PATCH', `/api/tasks/${task.id}/status`, { token: bob.token, body: { status: 'in_progress' } });
    assert.equal(status.status, 200);
    assert.equal(status.body.data.status, 'in_progress');

    assert.equal((await api.call('PATCH', `/api/tasks/${task.id}/status`, { token: bob.token, body: { status: 'finished' } })).status, 400);
    assert.equal((await api.call('PATCH', `/api/tasks/${task.id}`, { token: bob.token, body: { title: 'Mine now' } })).status, 403);
    assert.equal((await api.call('DELETE', `/api/tasks/${task.id}`, { token: bob.token })).status, 403);
  });

  it('updates a task (owner) and rejects an empty update', async () => {
    const res = await api.call('PATCH', `/api/tasks/${task.id}`, { token: alice.token, body: { title: 'Design new homepage', dueDate: null } });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.title, 'Design new homepage');
    assert.equal(res.body.data.dueDate, null);
    assert.equal((await api.call('PATCH', `/api/tasks/${task.id}`, { token: alice.token, body: {} })).status, 400);
  });

  it('builds a task summary report and exports it as a JSON file', async () => {
    const report = await api.call('GET', '/api/reports/tasks', { token: alice.token });
    assert.equal(report.status, 200);
    assert.equal(report.body.data.totalTasks, 4);
    assert.equal(report.body.data.byStatus.done, 1);
    assert.equal(report.body.data.byStatus.in_progress, 2);
    assert.equal(report.body.data.completionRate, 25);

    const exp = await api.call('GET', '/api/reports/tasks/export', { token: alice.token });
    assert.equal(exp.status, 200);
    assert.match(exp.headers.get('content-disposition'), /attachment; filename="tasks-export-/);
    const parsed = JSON.parse(exp.text);
    assert.equal(parsed.tasks.length, 4);
    assert.equal(parsed.exportedBy.email, 'alice@example.com');
    assert.equal(fs.readdirSync(api.exportDir).filter((f) => f.endsWith('.json')).length, 1);
  });

  it('survives many concurrent writes without losing data', async () => {
    const before = (await api.call('GET', '/api/tasks?limit=100', { token: alice.token })).body.meta.total;
    const results = await Promise.all(Array.from({ length: 25 }, (_, i) => newTask({ title: `Concurrent ${i}` })));
    assert.ok(results.every((r) => r.status === 201));
    const after = (await api.call('GET', '/api/tasks?limit=100', { token: alice.token })).body.meta.total;
    assert.equal(after, before + 25);
    const onDisk = JSON.parse(fs.readFileSync(path.join(api.dataDir, 'tasks.json'), 'utf8'));
    assert.equal(onDisk.length, before + 25); // file is valid JSON and has every task
  });

  it('deletes a task, and deleting a project deletes its tasks', async () => {
    assert.equal((await api.call('DELETE', `/api/tasks/${task.id}`, { token: alice.token })).status, 200);
    assert.equal((await api.call('GET', `/api/tasks/${task.id}`, { token: alice.token })).status, 404);

    assert.equal((await api.call('DELETE', `/api/projects/${project.id}`, { token: alice.token })).status, 200);
    assert.equal((await api.call('GET', `/api/projects/${project.id}`, { token: alice.token })).status, 404);
    const left = await api.call('GET', '/api/tasks', { token: alice.token });
    assert.equal(left.body.meta.total, 0);
  });
});
