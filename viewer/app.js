var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fs=require("fs")
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Configuration de Morgan pour enregistrer les logs dans un fichier
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
var errorLogStream = fs.createWriteStream(path.join(__dirname, 'error.log'), { flags: 'a' });
var combinedLogStream = fs.createWriteStream(path.join(__dirname, 'combined.log'), { flags: 'a' });
var commonLogStream = fs.createWriteStream(path.join(__dirname, 'common.log'), { flags: 'a' });
var shortLogStream = fs.createWriteStream(path.join(__dirname, 'short.log'), { flags: 'a' });
var tinyLogStream = fs.createWriteStream(path.join(__dirname, 'tiny.log'), { flags: 'a' });
app.use((req, res, next) => {
  res.header('ngrok-skip-browser-warning', 'true');
  next();
});


app.use(logger('dev'));
app.use(logger('combined', { stream: combinedLogStream }));
app.use(logger('common', { stream: commonLogStream }));
app.use(logger('short', { stream: shortLogStream }));
app.use(logger('tiny', { stream: tinyLogStream }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// Serve files from good directory
app.use('/good', express.static(path.join(__dirname, 'good')));
const t=require("./utils")
// Route to get original image URL
app.get('/get-original-url/:dir/:file', (req, res) => {
  const { dir, file } = req.params;
  try {
    const downloads = JSON.parse(fs.readFileSync(__dirname+'/downloads.json', 'utf8'));
    const download = downloads.downloads.find(d => d.localPath === path.join(__dirname, 'good', dir, file));
    let newentry=t.findMatchingLinks(download.originalLink)
    downloads.downloads[downloads.downloads.indexOf(download)]={...download,
      texte:newentry[0].texte}
    fs.writeFileSync(__dirname+'/downloads.json', JSON.stringify(downloads, null, 2));
    if (download) {
      console.log({ originalUrl: download.originalLink,
        texte:newentry[0].texte,
        account:newentry[0].fileName})
      res.json({ originalUrl: download.originalLink,
        texte:newentry[0].texte,
        account:newentry[0].fileName });
    } else {
      res.status(404).json({ error: 'Original URL not found' });
    }
  } catch (error) {
    console.error('Error fetching original URL:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
