export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }

  static badRequest(msg, details) {
    return new AppError(msg, 400, 'BAD_REQUEST', details);
  }
  static unauthorized(msg = 'Unauthorized') {
    return new AppError(msg, 401, 'UNAUTHORIZED');
  }
  static forbidden(msg = 'Forbidden') {
    return new AppError(msg, 403, 'FORBIDDEN');
  }
  static notFound(msg = 'Not found') {
    return new AppError(msg, 404, 'NOT_FOUND');
  }
  static conflict(msg, details) {
    return new AppError(msg, 409, 'CONFLICT', details);
  }
}
