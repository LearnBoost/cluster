
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http')
  , connect = require('connect');

// edit /etc/hosts
//   127.0.0.1 foo.com
//   127.0.0.1 bar.com

var app = http.createServer(function(req, res){
  var body = 'Hello from foo.com';
  res.writeHead(200, { 'Content-Length': body.length });
  res.end(body);
});

var app2 = http.createServer(function(req, res){
  var body = 'Hello from bar.com';
  res.writeHead(200, { 'Content-Length': body.length });
  res.end(body);
});

var server = connect.createServer();

server.use(connect.vhost('foo.com', app));
server.use(connect.vhost('bar.com', app2));
server.use(function(req, res){
  res.writeHead(200);
  res.end('Visit foo.com or bar.com');
});

cluster(server)
  .use(cluster.debug())
  .listen(80);