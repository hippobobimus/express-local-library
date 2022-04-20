import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import debugLib from 'debug';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import catalogRouter from './routes/catalog.js';
import compression from 'compression';
import helmet from 'helmet';

const debug = debugLib('express-local-library:app');

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const db = mongoose.connection;

const app = express();

// Security: sets various HTTP headers.
app.use(helmet());

// Setup mongoose collection
const mongoDB =
  'mongodb+srv://tutorial-user:uHf4BdnH1zwtdm0Q@cluster0.gryfu.mongodb.net/local_library?retryWrites=true&w=majority';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

db.on('error', (error) => debug('MongoDB connection error:' + error));

// view engine setup
app.set('views', path.join(dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Compress all routes
app.use(compression());

app.use(express.static(path.join(dirname, 'public')));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
