// register, login, profile update-inte data rules

const { z } = require('./common');

const email = z.string().trim().toLowerCase().email('Invalid email address');

const registerBody = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

const loginBody = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

const profileBody = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
  currentPassword: z.string().min(1, 'Current password is required'),
}).partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Send at least one field' })
  .refine((data) => !data.password || data.currentPassword, {
    message: 'Current password is required to change the password',
    path: ['currentPassword'],
  });

module.exports = { registerBody, loginBody, profileBody };