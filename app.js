// JavaScript source code
//imports the framework into your app.
var express = require('express');
//is a core Node module for working with and handling paths.
var path = require('path');
// is Express middleware you probably want to use if you're doing anything with forms
// need if use JSON
var bodyParser = require('body-parser');
//two dummy pages to show you how routing works.
/*var routes = require('./routes/index');
var users = require('./routes/users');*/
//To use the HTTP server and client
var http = require('http');
// application fro express module
var app = express();
// read file system?
var fs = require('fs');
/* display website icon. remove because not necessary
var favicon = require('serve-favicon');*/

/*morgan is Express middleware for logging requests and responses
also remove this module without any consequences.
var logger = require('morgan');*/

/*helps you with handling cookies
var cookieParser = require('cookie-parser');*/
//----------------------------------------------------------------------------
// view engine setup
app.set('port', process.env.PORT || 3000);
// this will set your apps view folder to something like /minhp/GoogleMapAPI/views
app.set('views', path.join(__dirname, 'views'));

// gives your app the ability to parse JSON. 
// This is necessary for when you're sending data in JSON format. 
app.use(bodyParser.json());
//tells your app to use the /public directory where you store images, stylesheets and scripts.
app.use(express.static(path.join(__dirname, 'public')));
// first parameter is the path, second is function to execute
/*
app.use('/', routes);
app.use('/users', users);
*/
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient;

var db;
// Connect to the db
MongoClient.connect("mongodb://localhost:27017/tweets", function (err, database) {
    if (err) {
        console.error(err);
    }
    else {
        db = database;
    }
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


// dynamically include routes (Controller)

/*fs.readdirsync('./controllers').forEach(function (file) {
    if (file.substr(-3) == '.js') {
        route = require('./controllers/' + file);
        route.controller(app);
    }
});*/

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + 'views/map.html'));
});



// app listening to port
http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});