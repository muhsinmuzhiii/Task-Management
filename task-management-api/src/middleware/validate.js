// Ithu enthinaanu: controller run aakunnathinu munpu vanna data (body, query, URL-ile id) Zod rules vechu check cheyyum.
// Shariyaanenkil: clean data req-il maarum, pinne next() vilikkum.
// Thettaanenkil: 400 VALIDATION_ERROR tharum, koode ethu field-il enthu thettu ennu (details).

const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

// validate({ body: schema, query: schema, params: schema })
// checks the request with zod before the controller runs
module.exports = function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // req.query can't be assigned directly in new Express versions
        Object.defineProperty(req, 'query', { value: parsed, writable: true, configurable: true });
      }
      if (schemas.body) req.body = schemas.body.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
        return next(new AppError(400, 'Validation failed', 'VALIDATION_ERROR', details));
      }
      next(err);
    }
  };
};