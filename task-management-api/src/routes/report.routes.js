const router = require('express').Router();
const controller = require('../controllers/report.controller');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/tasks', controller.taskSummary);
router.get('/tasks/export', controller.exportTasks);

module.exports = router;