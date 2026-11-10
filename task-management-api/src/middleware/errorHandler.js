// project-ile ellaa error-um avasaanam ivide ethum, ellaam ore format-il ({ success: false, error: { code, message, details } }).

// notFound: URL match aayillenkil 404.
// errorHandler: nammude AppError aanenkil athinte status/message edukkum. JSON thettaanenkil 400 INVALID_JSON. Ariyaatha error aanenkil console-il log cheythu client-inu “Something went wrong” mathram kodukkum (internal vivaram purathu varilla).
// errorHandler-inu err, req, res, next ennu naalu parameters venam. Athu kondu Express ithine error handler ennu manassilaakkunnu.


const AppError = require('../utils/AppError');

// runs when no route matched
function notFound(req, res, next) {
  next(new AppError(404, 'Route not found: ' + req.method + ' ' + req.originalUrl, 'ROUTE_NOT_FOUND'));
}

// every error in the app ends up here, so the error response is always the same shape
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Something went wrong on the server';
  let details;

  if (err instanceof AppError) {
    status = err.status;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    code = 'INVALID_JSON';
    message = 'Request body is not valid JSON';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body is too large';
  } else {
    console.error(err); // unknown error: log it, but do not show it to the user
  }

  res.status(status).json({ success: false, error: { code, message, details } });
}

module.exports = { notFound, errorHandler };