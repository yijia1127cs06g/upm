var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

// DataBase 
/*
var mysql = require("mysql");
var db_config= {
    host: "localhost",
    user: "root",
    password: "1234",
    database: "upm"
};
var db_con= null;

var dbConnect= function() {
    db_con = mysql.createConnection(db_config);	

    db_con.connect(function(err) { // The server is either down or restarting (takes a while sometimes).
    if(err) {
	  console.log();	
      console.log('error when connecting to db:', err);
      setTimeout(dbConnect, 4000); // We introduce a delay before attempting to reconnect to avoid a hot loop.
    }	
	else {										
	  console.log('db connecting success');	  
	  setTimeout(function () {     // force db to keep the connection alive
		  if(db_con!=null) {
			  db_con.query('SELECT 1');
		  }
	  }, 10000);
	  
	}
  });                                     
                                          
  db_con.on('error', function(err) {
	db_con= null;  
    console.log('db error', err);
	setTimeout(dbConnect, 4000);
  });
}

dbConnect();
*/
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/*
// db state
app.use(function(req, res, next) {
    req.con = db_con;
    next();
});
*/
app.use('/', routes);
app.use('/users', users);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
