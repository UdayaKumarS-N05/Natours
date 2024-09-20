const express = require('express');
const morgan = require('morgan');
const globalErrorHandler = require('./controllers/errorControllers');
const AppError = require('./utils/appError');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSantize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

// middlewares
app.use(helmet());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  message: 'Too many requests! Try after 1 hour',
});

app.use('/api', limiter);

// Below is to able to have access to req.body
app.use(express.json());

// Data santization against NoSQL query injection
app.use(mongoSantize());
// Data sanitization against XSS
app.use(xss());

// Prevent http parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingQuantity',
      'ratingsAvg',
      'price',
      'maxGroupSize',
      'difficulty',
    ],
  }),
);

// Using the routers as middleware.
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
