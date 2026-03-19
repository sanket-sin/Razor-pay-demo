import { AppError } from '../utils/AppError.js';

export function validateBody(schema) {
  return (req, res, next) => {
    const r = schema.safeParse(req.body);
    if (!r.success) {
      return next(AppError.badRequest('Validation failed', r.error.flatten()));
    }
    req.validated = { ...(req.validated || {}), body: r.data };
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const r = schema.safeParse(req.query);
    if (!r.success) {
      return next(AppError.badRequest('Query validation failed', r.error.flatten()));
    }
    req.validated = { ...(req.validated || {}), query: r.data };
    next();
  };
}
