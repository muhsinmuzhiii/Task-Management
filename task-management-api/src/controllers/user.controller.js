const asyncHandler = require('../utils/asyncHandler');
const { sendOk } = require('../utils/response');
const authService = require('../services/authService');

const getProfile = (req, res) => {
  sendOk(res, req.user);
};

const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  sendOk(res, user);
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await authService.listUsers();
  sendOk(res, users);
});

module.exports = { getProfile, updateProfile, listUsers };
