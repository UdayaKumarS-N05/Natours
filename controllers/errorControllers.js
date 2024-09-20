const AppError = require('../utils/appError');

const sendErrorDev = function (err, res) {
  return res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    err,
  });
};

const sendErrorProd = function (err, res) {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      statusCode: err.statusCode,
      status: err.status,
      message: err.message,
    });
  } else {
    console.error(`Error: ${err}`);
    res.status(500).json({
      err,
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.error.path} :${err.error.value}`;
  console.log(message);
  return new AppError(message, 400, err);
};

const handleDuplicatedErrorDB = (req, err) => {
  const message = `${req.body.name} already exists. Please try a unique name.`;
  return new AppError(message, 400, err);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.error.errors).map((v) => v.message);
  const message = errors.join('. ');
  return new AppError(message, 400, err);
};

const handleJWTError = (err) =>
  new AppError('Invalid token. Please login again!', 401, err);

const handleTokenExpiredError = () =>
  new AppError('Session expired. Please login again.', 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    console.log('err', err);
    console.log('error', error);
    if (error.name === 'CastError') error = handleCastErrorDB(err);
    if (err.error.code === 11000) error = handleDuplicatedErrorDB(req, err);
    if (err.error.name === 'ValidationError')
      error = handleValidationErrorDB(err);
    if (err.error.name === 'JsonWebTokenError') error = handleJWTError(err);
    if (err.error.name === 'TokenExpiredError')
      error = handleTokenExpiredError();
    sendErrorProd(error, res);
  }
};
