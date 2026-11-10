const crypto = require('crypto');
const store = require('../utils/fileStore');
const AppError = require('../utils/AppError');

const notFound = () => new AppError(404, 'Project not found', 'PROJECT_NOT_FOUND');
const notAllowed = () => new AppError(403, 'You do not have access to this project', 'FORBIDDEN');

// a project can only be used by the user who created it
async function getProject(userId, projectId) {
  const projects = await store.getAll('projects');
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw notFound();
  if (project.ownerId !== userId) throw notAllowed();
  return project;
}

async function createProject(userId, { name, description, assignedDate, submissionDate, dueDate }) {
  const now = new Date().toISOString();
  const project = {
    id: crypto.randomUUID(),
    name,
    description,
    assignedDate: assignedDate || null,
    submissionDate: submissionDate || null,
    dueDate: dueDate || null,
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
  };
  await store.change('projects', (projects) => {
    projects.push(project);
  });
  return project;
}

async function listProjects(userId, query) {
  const projects = await store.getAll('projects');
  const mine = projects.filter((p) => p.ownerId === userId);

  // sorting (default: newest first)
  const field = query.sortBy || 'createdAt';
  const direction = query.order === 'asc' ? 1 : -1;
  mine.sort((a, b) => {
    if (a[field] < b[field]) return -direction;
    if (a[field] > b[field]) return direction;
    return 0;
  });

  // pagination is done in the controller by paginate()
  return mine;
}

async function updateProject(userId, projectId, changes) {
  return store.change('projects', (projects) => {
    const project = projects.find((p) => p.id === projectId);
    if (!project) throw notFound();
    if (project.ownerId !== userId) throw notAllowed();

    Object.assign(project, changes, { updatedAt: new Date().toISOString() });
    return { ...project };
  });
}

async function deleteProject(userId, projectId) {
  await store.change('projects', (projects) => {
    const index = projects.findIndex((p) => p.id === projectId);
    if (index === -1) throw notFound();
    if (projects[index].ownerId !== userId) throw notAllowed();
    projects.splice(index, 1);
  });

  // the tasks of the deleted project are deleted too
  await store.change('tasks', (tasks) => {
    const remaining = tasks.filter((t) => t.projectId !== projectId);
    tasks.length = 0;
    tasks.push(...remaining);
  });
}

module.exports = { getProject, createProject, listProjects, updateProject, deleteProject };