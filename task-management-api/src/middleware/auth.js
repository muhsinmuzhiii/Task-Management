// login cheytha user aano ennu nokkunna middleware.

// Request-ile Authorization: Bearer <token> header vaayikkum.
// Token illenkil 401 tharum.
// Shariyaanenkil user-ine req.user-il vekkum, pinne controller-il req.user.id upayogikkaam.



const AppError = require('../utils/AppError');
const authService = require('../services/authService');

// put this on any route that needs a logged in user. Expects the header
// Authorization: Bearer <token>
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new AppError(401, 'Please login first', 'UNAUTHENTICATED');

    req.user = await authService.getUserFromToken(token);
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = auth;