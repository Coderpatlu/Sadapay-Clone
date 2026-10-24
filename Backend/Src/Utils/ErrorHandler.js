/**
 * We use ErrorHandler to extends error and give us clear cut message
 */

class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith(4) ? "fail" : "error";
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
