const router = require('express').Router();
const controller = require('../controllers/project.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParams } = require('../validators/common');
const { createBody, updateBody, listQuery } = require('../validators/project.validator');

router.use(auth);

router.post('/', validate({ body: createBody }), controller.createProject);
router.get('/', validate({ query: listQuery }), controller.listProjects);
router.get('/:id', validate({ params: idParams }), controller.getProject);
router.patch('/:id', validate({ params: idParams, body: updateBody }), controller.updateProject);
router.delete('/:id', validate({ params: idParams }), controller.deleteProject);

module.exports = router;