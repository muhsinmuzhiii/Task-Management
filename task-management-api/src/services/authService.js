const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const store = require('../utils/fileStore');
const AppError = require('../utils/AppError');
const { jwtSecret, jwtExpiresIn, bcryptRounds } = require('../config/env');

// tokens of users who logged out. It is only kept in memory, so it is cleared when the server restarts.
const loggedOutTokens = new Set();

// never send the password hash to the client
function removePassword(user) {
  const copy = { ...user };
  delete copy.passwordHash;
  return copy;
}

function makeToken(user) {
  return jwt.sign({ id: user.id }, jwtSecret, { expiresIn: jwtExpiresIn });
}

async function getUserById(id) {
  const users = await store.getAll('users');
  return users.find((u) => u.id === id);
}

async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, bcryptRounds);
  const now = new Date().toISOString();
  const user = { id: crypto.randomUUID(), name, email, passwordHash, createdAt: now, updatedAt: now };

  // the email check and the save happen together, so two people can't register the same email
  await store.change('users', (users) => {
    if (users.some((u) => u.email === email)) {
      throw new AppError(409, 'Email is already registered', 'EMAIL_TAKEN');
    }
    users.push(user);
  });

  return { user: removePassword(user), token: makeToken(user) };
}

async function login({ email, password }) {
  const users = await store.getAll('users');
  const user = users.find((u) => u.email === email);

  // same message for wrong email and wrong password
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }
  return { user: removePassword(user), token: makeToken(user) };
}

function logout(token) {
  loggedOutTokens.add(token);
}

// used by the auth middleware
async function getUserFromToken(token) {
  if (loggedOutTokens.has(token)) {
    throw new AppError(401, 'You are logged out, please login again', 'UNAUTHENTICATED');
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret);
  } catch (err) {
    throw new AppError(401, 'Invalid or expired token', 'UNAUTHENTICATED');
  }

  const user = await getUserById(payload.id);
  if (!user) throw new AppError(401, 'User no longer exists', 'UNAUTHENTICATED');
  return removePassword(user);
}

async function updateProfile(userId, data) {
  const changes = {};
  if (data.name) changes.name = data.name;
  if (data.email) changes.email = data.email;

  if (data.password) {
    const user = await getUserById(userId);
    const passwordOk = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!passwordOk) throw new AppError(400, 'Current password is wrong', 'WRONG_PASSWORD');
    changes.passwordHash = await bcrypt.hash(data.password, bcryptRounds);
  }

  const updated = await store.change('users', (users) => {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new AppError(404, 'User not found', 'USER_NOT_FOUND');

    const emailUsed = changes.email && users.some((u) => u.id !== userId && u.email === changes.email);
    if (emailUsed) throw new AppError(409, 'Email is already registered', 'EMAIL_TAKEN');

    Object.assign(user, changes, { updatedAt: new Date().toISOString() });
    return { ...user };
  });
  return removePassword(updated);
}

// id, name and email of everyone (needed to pick someone to assign a task to)
async function listUsers() {
  const users = await store.getAll('users');
  return users.map((u) => ({ id: u.id, name: u.name, email: u.email }));
}

module.exports = { register, login, logout, getUserById, getUserFromToken, updateProfile, listUsers };