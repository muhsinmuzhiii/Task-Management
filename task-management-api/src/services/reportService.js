const fs = require('fs/promises');
const path = require('path');
const taskService = require('./taskService');
const { exportDir } = require('../config/env');

function makeSummary(tasks, projects) {
  const now = new Date().toISOString();
  const byStatus = { todo: 0, in_progress: 0, done: 0 };
  const byPriority = { low: 0, medium: 0, high: 0 };
  const byAssignee = {};
  const projectStats = {};
  let overdue = 0;

  for (const task of tasks) {
    byStatus[task.status]++;
    byPriority[task.priority]++;

    if (task.dueDate && task.dueDate < now && task.status !== 'done') overdue++;

    const assignee = task.assigneeId || 'unassigned';
    byAssignee[assignee] = (byAssignee[assignee] || 0) + 1;

    if (!projectStats[task.projectId]) {
      const project = projects.find((p) => p.id === task.projectId);
      projectStats[task.projectId] = {
        projectId: task.projectId,
        name: project ? project.name : 'Unknown',
        total: 0,
        done: 0,
      };
    }
    projectStats[task.projectId].total++;
    if (task.status === 'done') projectStats[task.projectId].done++;
  }

  return {
    generatedAt: now,
    totalTasks: tasks.length,
    completionRate: tasks.length ? Math.round((byStatus.done / tasks.length) * 100) : 0,
    overdue,
    byStatus,
    byPriority,
    byProject: Object.values(projectStats),
    byAssignee,
  };
}

async function getTaskSummary(user) {
  const { tasks, projects } = await taskService.getMyTasks(user.id);
  return makeSummary(tasks, projects);
}

// writes all tasks of the user to a json file in the exports folder
async function exportTasks(user) {
  const { tasks, projects } = await taskService.getMyTasks(user.id);
  const content = {
    exportedAt: new Date().toISOString(),
    exportedBy: { id: user.id, name: user.name, email: user.email },
    summary: makeSummary(tasks, projects),
    tasks,
  };

  await fs.mkdir(exportDir, { recursive: true });
  const fileName = 'tasks-export-' + user.id + '-' + Date.now() + '.json';
  const filePath = path.join(exportDir, fileName);
  await fs.writeFile(filePath, JSON.stringify(content, null, 2));
  return { filePath, fileName };
}

module.exports = { getTaskSummary, exportTasks };