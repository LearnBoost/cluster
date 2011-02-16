
/**
 * Module dependencies.
 */

var cluster = require('../')
  , RedisStore = require('connect-redis')
  , connect = require('connect')
  , http = require('http');

// setup:
//   $ npm install connect
//   $ npm install connect-redis
//   $ redis-server

var server = connect.createServer()
  , store = new RedisStore;

server.use(connect.cookieDecoder());
server.use(connect.session({ store: store, secret: 'keyboard cat' }));
server.use(connect.favicon());
server.use(function(req, res, next){
  req.session.views = req.session.views || 0;
  ++req.session.views;
  res.end('views ' + req.session.views);
});

cluster(server)
  .use(cluster.debug())
  .listen(3000);