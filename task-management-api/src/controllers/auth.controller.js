const asyncHandler = require('../utils/asyncHandler');
const { sendOk, sendCreated } = require('../utils/response');
const authService = require('../services/authService');

const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  sendCreated(res, result);
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  sendOk(res, result);
});

const logout = (req, res) => {
  authService.logout(req.token);
  sendOk(res, { message: 'Logged out successfully' });
};

const me = (req, res) => {
  sendOk(res, req.user);
};

module.exports = { register, login, logout, me };