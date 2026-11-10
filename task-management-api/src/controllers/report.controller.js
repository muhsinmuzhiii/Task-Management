const asyncHandler = require('../utils/asyncHandler');
const { sendOk } = require('../utils/response');
const reportService = require('../services/reportService');

const taskSummary = asyncHandler(async (req, res) => {
  const summary = await reportService.getTaskSummary(req.user);
  sendOk(res, summary);
});

const exportTasks = asyncHandler(async (req, res, next) => {
  const { filePath, fileName } = await reportService.exportTasks(req.user);
  // sends the file as a download
  res.download(filePath, fileName, (err) => {
    if (err) next(err);
  });
});

module.exports = { taskSummary, exportTasks };