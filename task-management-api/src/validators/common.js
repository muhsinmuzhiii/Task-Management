// status (todo/in_progress/done), priority (low/medium/high), id shariyaaya UUID aano ennu nokkal, date-ine ISO format-ilekku maattal, page/limit rules ennivayokke ivide aanu. z.coerce.number() URL-ile "2" ennna text-ine number aakkum.

const { z } = require('zod');

const statusValues = ['todo', 'in_progress', 'done'];
const priorityValues = ['low', 'medium', 'high'];

const id = z.string().uuid('Invalid id');
const idParams = z.object({ id });

function isDate(value) {
  return !Number.isNaN(Date.parse(value));
}

// date in the body -> saved as ISO string
const dateBody = z.string().trim()
  .refine(isDate, { message: 'Must be a valid date, like 2026-12-31' })
  .transform((v) => new Date(v).toISOString());

// date in the query (dueAfter / dueBefore). A date without time covers the whole day.
function dateQuery(endOfDay) {
  return z.string().trim()
    .refine(isDate, { message: 'Must be a valid date, like 2026-12-31' })
    .transform((v) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        return new Date(v + (endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z')).toISOString();
      }
      return new Date(v).toISOString();
    });
}

const paging = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};

module.exports = { z, statusValues, priorityValues, id, idParams, dateBody, dateQuery, paging };