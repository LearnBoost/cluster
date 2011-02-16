
/**
 * Module dependencies.
 */

var cluster = require('../')
  , RedisStore = require('connect-redis')
  , express = require('express')
  , http = require('http');

// setup:
//   $ npm install express
//   $ npm install connect-redis
//   $ redis-server

var app = express.createServer()
  , store = new RedisStore;

app.use(express.cookieDecoder());
app.use(express.session({ store: store, secret: 'keyboard cat' }));
app.use(express.favicon());
app.use(function(req, res, next){
  req.session.views = req.session.views || 0;
  ++req.session.views;
  res.end('views ' + req.session.views);
});

cluster(app)
  .use(cluster.debug())
  .listen(3000);