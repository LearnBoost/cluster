
/**
 * Module dependencies.
 */

var cluster = require('../')
  , connect = require('connect')
  , http = require('http');

// setup:
//   $ npm install connect

var server = connect.createServer();

server.use(function(req, res, next){
  var body = 'Hello World';
  res.writeHead(200, { 'Content-Length': body.length });
  res.end(body);
});

cluster(server)
  .set('workers', 4)
  .use(cluster.debug())
  .listen(3000);