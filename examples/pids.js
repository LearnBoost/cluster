
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http');

var body = 'Hello World'
  , len = body.length;
var server = http.createServer(function(req, res){
  res.writeHead(200, { 'Content-Length': len });
  res.end(body);
});

cluster(server)
  .use(cluster.debug())
  .use(cluster.pidfiles())
  .use(cluster.logger())
  .listen(3000);