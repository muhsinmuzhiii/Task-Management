const router = require('express').Router();
const controller = require('../controllers/task.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParams } = require('../validators/common');
const { createBody, updateBody, statusBody, assignBody, listQuery } = require('../validators/task.validator');

router.use(auth);

router.post('/', validate({ body: createBody }), controller.createTask);
router.get('/', validate({ query: listQuery }), controller.listTasks);
router.get('/:id', validate({ params: idParams }), controller.getTask);
router.patch('/:id', validate({ params: idParams, body: updateBody }), controller.updateTask);
router.delete('/:id', validate({ params: idParams }), controller.deleteTask);
router.patch('/:id/status', validate({ params: idParams, body: statusBody }), controller.updateStatus);
router.patch('/:id/assign', validate({ params: idParams, body: assignBody }), controller.assignTask);

module.exports = router;