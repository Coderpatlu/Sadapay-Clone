/**
 * We use ErrorMiddleware  to catch global errors in routes and over all app
 */

const ErrorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // MONGOOSE DUPLICATION
  if (err.code === 11000) {
    err.statusCode = 409;
    err.message = "Resource already exists";
  }
  // MONGOOSE CAST-ERROR
  if (err.name === "CastError") {
    err.statusCode = 400;
    err.message = `Invalid ${err.path}`;
  }
  // MONGOOSE VALIDATION
  if (err.name === "ValidationError") {
    err.statusCode = 400;
    err.message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }
  // JWT TOKEN
  if (err.name === "JsonWebTokenError") {
    err.statusCode = 401;
    err.message = "Invalid Token";
  }
  if (err.name === "TokenExpiredError") {
    err.statusCode = 401;
    err.message = "Token Expired";
  }
  // DEVELOPMENT
  if (process.env.NODE_ENV === "DEVELOPMENT") {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err,
    });
  }
  // PRODUCTION
  return res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
  });
};
export default ErrorMiddleware;
