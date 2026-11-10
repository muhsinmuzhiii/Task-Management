const asyncHandler = require('../utils/asyncHandler');
const { sendOk, sendCreated } = require('../utils/response');
const { paginate } = require('../utils/pagination');
const taskService = require('../services/taskService');

const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.body);
  sendCreated(res, task);
});

const listTasks = asyncHandler(async (req, res) => {
  const tasks = await taskService.listTasks(req.user.id, req.query);
  const result = paginate(tasks, req.query.page, req.query.limit, req);
  sendOk(res, result.data, result.meta);
});

const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTask(req.user.id, req.params.id);
  sendOk(res, task);
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user.id, req.params.id, req.body);
  sendOk(res, task);
});

const updateStatus = asyncHandler(async (req, res) => {
  const task = await taskService.updateStatus(req.user.id, req.params.id, req.body.status);
  sendOk(res, task);
});

const assignTask = asyncHandler(async (req, res) => {
  const task = await taskService.assignTask(req.user.id, req.params.id, req.body.assigneeId);
  sendOk(res, task);
});

const deleteTask = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.user.id, req.params.id);
  sendOk(res, { message: 'Task deleted' });
});

module.exports = { createTask, listTasks, getTask, updateTask, updateStatus, assignTask, deleteTask };