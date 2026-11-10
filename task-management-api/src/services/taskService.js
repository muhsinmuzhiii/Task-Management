// Who can do what with a task:
// - owner of the project: everything
// - person the task is assigned to: see it and change the status
// - everyone else: nothing
const crypto = require('crypto');
const store = require('../utils/fileStore');
const AppError = require('../utils/AppError');
const projectService = require('./projectService');
const authService = require('./authService');

const priorityNumber = { low: 1, medium: 2, high: 3 };

const notAllowed = () => new AppError(403, 'You do not have access to this task', 'FORBIDDEN');

// finds the task and tells if this user is the owner or the assignee
async function loadTask(taskId, userId) {
  const tasks = await store.getAll('tasks');
  const task = tasks.find((t) => t.id === taskId);
  if (!task) throw new AppError(404, 'Task not found', 'TASK_NOT_FOUND');

  const projects = await store.getAll('projects');
  const project = projects.find((p) => p.id === task.projectId);

  return {
    task,
    isOwner: Boolean(project) && project.ownerId === userId,
    isAssignee: task.assigneeId === userId,
  };
}

async function checkAssignee(assigneeId) {
  if (assigneeId && !(await authService.getUserById(assigneeId))) {
    throw new AppError(400, 'Assignee user does not exist', 'ASSIGNEE_NOT_FOUND');
  }
}

// all tasks this user is allowed to see (also used by the reports)
async function getMyTasks(userId) {
  const tasks = await store.getAll('tasks');
  const projects = await store.getAll('projects');
  const myProjectIds = projects.filter((p) => p.ownerId === userId).map((p) => p.id);

  const myTasks = tasks.filter((t) => myProjectIds.includes(t.projectId) || t.assigneeId === userId);
  return { tasks: myTasks, projects };
}

async function listTasks(userId, query) {
  const { tasks } = await getMyTasks(userId);

  let result = tasks.filter((t) => {
    if (query.status && t.status !== query.status) return false;
    if (query.priority && t.priority !== query.priority) return false;
    if (query.projectId && t.projectId !== query.projectId) return false;
    if (query.assigneeId && t.assigneeId !== query.assigneeId) return false;
    if (query.dueAfter && !(t.dueDate && t.dueDate >= query.dueAfter)) return false;
    if (query.dueBefore && !(t.dueDate && t.dueDate <= query.dueBefore)) return false;
    return true;
  });

  const direction = query.order === 'asc' ? 1 : -1;
  function sortValue(t) {
    return query.sortBy === 'priority' ? priorityNumber[t.priority] : t[query.sortBy];
  }
  result.sort((a, b) => {
    const x = sortValue(a);
    const y = sortValue(b);
    if (x == null && y == null) return 0;
    if (x == null) return 1; // tasks without a value (for example no due date) go to the end
    if (y == null) return -1;
    if (x < y) return -direction;
    if (x > y) return direction;
    return 0;
  });
  return result;
}

async function getTask(userId, taskId) {
  const { task, isOwner, isAssignee } = await loadTask(taskId, userId);
  if (!isOwner && !isAssignee) throw notAllowed();
  return task;
}

async function createTask(userId, data) {
  await projectService.getProject(userId, data.projectId); // throws if it is not your project
  await checkAssignee(data.assigneeId);

  const now = new Date().toISOString();
  const task = {
    id: crypto.randomUUID(),
    title: data.title,
    description: data.description,
    status: data.status,
    priority: data.priority,
    assignedDate: data.assignedDate || now.slice(0, 10),
    submissionDate: data.submissionDate || null,
    dueDate: data.dueDate || null,
    projectId: data.projectId,
    assigneeId: data.assigneeId || null,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };
  await store.change('tasks', (tasks) => {
    tasks.push(task);
  });
  return task;
}

// saves the changes of one task
function saveChanges(taskId, changes) {
  return store.change('tasks', (tasks) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) throw new AppError(404, 'Task not found', 'TASK_NOT_FOUND');
    Object.assign(task, changes, { updatedAt: new Date().toISOString() });
    return { ...task };
  });
}

async function updateTask(userId, taskId, changes) {
  const { task, isOwner, isAssignee } = await loadTask(taskId, userId);
  if (!isOwner) {
    if (isAssignee) throw new AppError(403, 'Assignees can only change the status', 'FORBIDDEN');
    throw notAllowed();
  }

  // moving a task to another project is only allowed if you own that project too
  if (changes.projectId && changes.projectId !== task.projectId) {
    await projectService.getProject(userId, changes.projectId);
  }
  await checkAssignee(changes.assigneeId);
  return saveChanges(taskId, changes);
}

async function updateStatus(userId, taskId, status) {
  const { isOwner, isAssignee } = await loadTask(taskId, userId);
  if (!isOwner && !isAssignee) throw notAllowed();
  return saveChanges(taskId, { status });
}

async function assignTask(userId, taskId, assigneeId) {
  const { isOwner } = await loadTask(taskId, userId);
  if (!isOwner) throw notAllowed();
  await checkAssignee(assigneeId);
  return saveChanges(taskId, { assigneeId });
}

async function deleteTask(userId, taskId) {
  const { isOwner } = await loadTask(taskId, userId);
  if (!isOwner) throw notAllowed();

  await store.change('tasks', (tasks) => {
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) throw new AppError(404, 'Task not found', 'TASK_NOT_FOUND');
    tasks.splice(index, 1);
  });
}

module.exports = { getMyTasks, listTasks, getTask, createTask, updateTask, updateStatus, assignTask, deleteTask };