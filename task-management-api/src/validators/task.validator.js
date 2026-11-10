// createBody: title, projectId venam. status default todo, priority default medium.
// updateBody: ellaam optional, pakshe onnenkilum venam.
// statusBody, assignBody: status maattaan, assign cheyyaan.
// listQuery: filters (status, priority, projectId, assigneeId, dueAfter, dueBefore), sort (sortBy, order), page/limit.

const { z, statusValues, priorityValues, id, dateBody, dateQuery, paging } = require('./common');

const status = z.enum(statusValues);
const priority = z.enum(priorityValues);

const createBody = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(''),
  status: status.default('todo'),
  priority: priority.default('medium'),
  assignedDate: dateBody.nullable().optional(),
  submissionDate: dateBody.nullable().optional(),
  dueDate: dateBody.nullable().optional(),
  projectId: id,
  assigneeId: id.nullable().optional(),
});

const updateBody = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000),
  status,
  priority,
  assignedDate: dateBody.nullable(),
  submissionDate: dateBody.nullable(),
  dueDate: dateBody.nullable(),
  projectId: id,
  assigneeId: id.nullable(),
}).partial().refine((data) => Object.keys(data).length > 0, { message: 'Send at least one field' });

const statusBody = z.object({ status });
const assignBody = z.object({ assigneeId: id.nullable() });

const listQuery = z.object({
  ...paging,
  status: status.optional(),
  priority: priority.optional(),
  projectId: id.optional(),
  assigneeId: id.optional(),
  dueAfter: dateQuery(false).optional(),
  dueBefore: dateQuery(true).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'status', 'title']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

module.exports = { createBody, updateBody, statusBody, assignBody, listQuery };