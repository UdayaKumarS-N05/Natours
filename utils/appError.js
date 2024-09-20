// class AppError extends Error {
//   constructor(message, statusCode) {
//     super(message);
//     // Object.setPrototypeOf(this, AppError.prototype);
//     this.statusCode = statusCode;
//     this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
//     this.isOperational = true;
//     if (Error.captureStackTrace) {
//       Error.captureStackTrace(this, this.constructor);
//     }
//   }
// }

class AppError extends Error {
  constructor(message, statusCode, err) {
    super(message);
    this.statusCode = statusCode;
    // this.status = `${err.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    // this.name = err.name;
    this.error = err;
  }
}

module.exports = AppError;
