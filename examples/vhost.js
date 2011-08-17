
/**
 * Module dependencies.
 */

var cluster = require('../')
  , connect = require('connect');

// setup:
//   $ npm install connect
//   $ edit /etc/hosts

var server = connect();

var foo = connect().use(function(req, res){
  var body = 'Hello from foo.com';
  res.writeHead(200, { 'Content-Length': body.length });
  res.end(body);
});

var bar = connect().use(function(req, res){
  var body = 'Hello from bar.com';
  res.writeHead(200, { 'Content-Length': body.length });
  res.end(body);
});

server.use(connect.vhost('foo.com', foo));
server.use(connect.vhost('bar.com', bar));

cluster(server)
  .set('workers', 4)
  .use(cluster.debug())
  .listen(3000);