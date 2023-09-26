var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieSession = require('cookie-session');

var indexRouter = require('./routes/index');

var app = express();
const config = require('./config.json');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cookieSession({ secret: config.cookie_secret }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

app.listen(config.port, () => console.log(`Server started on port ${config.port}`));
