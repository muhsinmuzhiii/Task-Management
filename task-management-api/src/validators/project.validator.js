// createBody: name venam (1 muthal 120 character), description optional (default empty).
// updateBody: ellaam optional, pakshe onnenkilum venam.
// listQuery: page, limit (common.js-ilninnu), sortBy (createdAt/updatedAt/name), order (asc/de


const { z, paging, dateBody } = require('./common');

const createBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).default(''),
  assignedDate: dateBody.nullable().optional(),
  submissionDate: dateBody.nullable().optional(),
  dueDate: dateBody.nullable().optional(),
});

const updateBody = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000),
  assignedDate: dateBody.nullable(),
  submissionDate: dateBody.nullable(),
  dueDate: dateBody.nullable(),
}).partial().refine((data) => Object.keys(data).length > 0, { message: 'Send at least one field' });

const listQuery = z.object({
  ...paging,
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

module.exports = { createBody, updateBody, listQuery };