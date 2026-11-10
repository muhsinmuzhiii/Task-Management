const router = require('express').Router();
const controller = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerBody, loginBody } = require('../validators/auth.validator');

router.post('/register', validate({ body: registerBody }), controller.register);
router.post('/login', validate({ body: loginBody }), controller.login);
router.post('/logout', auth, controller.logout);
router.get('/me', auth, controller.me);

module.exports = router;