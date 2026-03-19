import { verifyToken } from '../utils/jwt.js';
import { AppError } from '../utils/AppError.js';
import { User } from '../models/index.js';

export async function authenticate(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or invalid Authorization header');
    }
    const token = auth.slice(7);
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.sub);
    if (!user) throw AppError.unauthorized('User not found');
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Invalid or expired token'));
    }
    next(e);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient role'));
    }
    next();
  };
}
