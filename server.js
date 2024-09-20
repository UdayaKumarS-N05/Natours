const dotenv = require('dotenv').config({ path: './config.env' });
const mongoose = require('mongoose');
const app = require('./app');

const DB = dotenv.parsed.DATABASE.replace(
  '<PASSWORD>',
  dotenv.parsed.DATABASE_PASSWORD,
);
console.log('DB', DB);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true,
  })
  .then(() => {});

const port = dotenv.parsed.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`App running on ${dotenv.parsed.PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.log('name', err.name, 'message', err.message);
  console.log('Unhandled Rejection! Shutting down...');
  server.close(() => {
    process.exit(1);
  });
});
