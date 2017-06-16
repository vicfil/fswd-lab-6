'use strict';

require('../setup');

// code to test
var server = require('../../lib/server');

// libraries
var request = require('supertest').agent;
    // User = require('../../models').User;

describe('/users', function() {
  var agent;

var models = require('../../models');

  beforeEach(function() {
    agent = request(server);
  });

  // after(function() {
  //   return User.truncate();
  // });

  it('should have a /register page', function() {
    return agent
      .get('/users/register')
      .expect(200);
  });

  it('should have a /login page', function() {
    return agent
      .get('/users/login')
      .expect(200);
  });

  it('should have a /logout page', function() {
    return agent
      .get('/users/logout')
      .expect(200);
  });



  describe('when a user exists', function() {
    var user;
    beforeEach(function() {
      return models.User.create({ username: 'MyFancyUsername',
                          password: 'MyFancyPassword' })
              .then(function(u) {
                user = u;
              });
    });

    it('should show an error that the username already exists', function() {
      console.log("User ID is " + user.id);
      return agent
        .post('/users/register')
        .type('form')
        .send({
          username: 'MyFancyUsername',
          password: 'MyFancyPassword',
          password_confirm: 'MyFancyPassword'
        })
        .expect(200, /That username already exists\./);
    });

  });

});
