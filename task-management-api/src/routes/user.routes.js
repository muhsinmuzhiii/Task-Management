const router = require('express').Router();
const controller = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { profileBody } = require('../validators/auth.validator');

router.use(auth);

router.get('/', controller.listUsers);
router.get('/me', controller.getProfile);
router.patch('/me', validate({ body: profileBody }), controller.updateProfile);

module.exports = router;