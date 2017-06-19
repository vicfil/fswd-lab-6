'use strict';

var express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    redis = require('connect-redis');
var loggedInUser= {};

app.use(cookieParser());

var models = require('../models');
/* istanbul ignore next */
if (process.env.NODE_ENV !== 'production') {
    var SequelizeStore = require('connect-session-sequelize')(session.Store);
    var sessionStore = new SequelizeStore({
        db: models.sequelize
    });
    sessionStore.sync();
    app.use(session({
        secret: 'Shhhhh!',
        store: sessionStore,
        saveUninitialized: false,
        resave: false
    }));
} else {
    var RedisStore = redis(session);
    app.use(session({
      secret: 'Shhhhh!',
      resave: false,
      saveUninitialized: true,
      store: new RedisStore()
    }));
}

/* istanbul ignore next */
if (process.env.NODE_ENV === 'development') {
    var webpackDevMiddleware = require("webpack-dev-middleware");
    var webpack = require("webpack");
    var webpackConfig = require("../webpack.config");

    var compiler = webpack(webpackConfig);

    app.use(webpackDevMiddleware(compiler, {
        publicPath: "/", // Same as `output.publicPath` in most cases.
        stats: {
            colors: true,
            hash: false,
            timings: true,
            chunks: false,
            chunkModules: false,
            modules: false
        }
    }));
}


app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static('public'));

app.set('views', './views');
app.set('view engine', 'pug');

app.use(function(request, response, next) {
  if (request.session.flash_message) {
    response.locals.flash_message = request.session.flash_message;
    delete request.session.flash_message;
    request.session.save(function() {
      next();
    });
  } else {
    next();
  }
});

app.get("/", function(request, response) {
  response.render('index');
});

// app.get('/:name', function(request, response) {
//   response.render('name', { name: request.params.name });
// });

app.get('/tasks', function(request, response) {
  models.Task.findAll()
    .then(function(tasks) {
      var highlightTaskId = request.session.newTaskId;
      delete request.session.newTaskId;
      request.session.save(function() {
          response.render('tasks/tasks', {
              tasks: tasks,
              highlightTaskId: highlightTaskId
          });
      })
    });
});

app.get('/tasks/:task_id', function(request, response) {
  console.log(request.session);
  models.Task.findById(request.params.task_id)
    .then(function(task) {
      response.render('tasks/task', { task: task });
    });
});

function redirectToTask(response, task) {
  response.redirect('/tasks/' + task.id);
}

app.post('/tasks/:task_id', function(request, response) {
  models.Task.findById(request.params.task_id)
    .then(function(task) {
      task.name = request.body.todo;
      return task.save();
    }).then(function (task) {
      request.session.flash_message = "Updated successfully!";
      redirectToTask(response, task);
    });
});

app.post('/tasks', function(request, response) {
  models.Task.create({ name: request.body.todo })
    .then(function(task) {
      request.session.flash_message = "Added task " + task.name + " successfully!";
      request.session.newTaskId = task.id;
      request.session.save(function() {
        response.redirect("/tasks");
      });
    });
});

app.get('/users/register', function(request, response) {
  response.render('users/register');
});

app.post('/users/register', function(request, response) {

  //create User
if(request.body.password === request.body.passwordConfirm){

    models.User.findAll({
    where: {
      username: request.body.username
    }

  }).then(function (listOfMatches){
      console.log('in the promise, listOfMatches = '+listOfMatches);
      if(listOfMatches[0]){
          response.locals.message = 'That username already exists. Please try again.'
          response.render('users/register');
      }
      else {

            models.User.create({username:request.body.username, password:request.body.password}).then(function(user){
            response.locals.message='You have sucessfully registered '+ user.username;
            response.render('users/register');
            response.locals.loggedIn=true;
          });

      }
    });
  }
  else {
    response.locals.message = 'Your password confirmation does not match.'
    response.render('users/register');
  }
});

app.get('/users/login', function(request, response) {
  response.locals.loggedInUser=loggedInUser;
  response.render('users/login');
});

app.post('/users/login', function(request, response) {
  models.User.findAll({
  where: {
    username: request.body.username
  }

}).then(function (listOfMatches){
    console.log('in the promise, listOfMatches = '+listOfMatches);

    if(listOfMatches[0]){
      var user = listOfMatches[0];
      loggedInUser.username = user.username;
      response.locals.loggedInUser=loggedInUser;
      response.locals.message = "Welcome back, " +loggedInUser.username;
      response.render('users/login')
    }//end if user
    else{
      response.locals.message="Username and/or password incorrect."
      response.render('users/login')
    }
  });//end findById promise chain
});

app.get('/users/logout', function(request, response) {
  loggedInUser.username="";
  response.locals.loggedInUser = loggedInUser;
  response.render('users/logout');
});

app.get('/users/users', function(request, response) {
  // models.User.findAll().then(function(users){
  //   response.locals.allUsers={};
  //   for (user in users){
  //     response.locals.allUsers{users.user.username:users.Id};
  //   }
  // });//end findAll promise
  response.render('users/users');
});

// allow other modules to use the server
module.exports = app;
