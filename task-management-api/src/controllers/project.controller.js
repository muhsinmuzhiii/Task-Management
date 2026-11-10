const asyncHandler = require('../utils/asyncHandler');
const { sendOk, sendCreated } = require('../utils/response');
const { paginate } = require('../utils/pagination');
const projectService = require('../services/projectService');

const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.user.id, req.body);
  sendCreated(res, project);
});

const listProjects = asyncHandler(async (req, res) => {
  const projects = await projectService.listProjects(req.user.id, req.query);
  const result = paginate(projects, req.query.page, req.query.limit, req);
  sendOk(res, result.data, result.meta);
});

const getProject = asyncHandler(async (req, res) => {
  const project = await projectService.getProject(req.user.id, req.params.id);
  sendOk(res, project);
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectService.updateProject(req.user.id, req.params.id, req.body);
  sendOk(res, project);
});

const deleteProject = asyncHandler(async (req, res) => {
  await projectService.deleteProject(req.user.id, req.params.id);
  sendOk(res, { message: 'Project and its tasks deleted' });
});

module.exports = { createProject, listProjects, getProject, updateProject, deleteProject };