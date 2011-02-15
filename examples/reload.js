
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http');

// try loading, and changing "Hello", to "Hello World"

var body = 'Hello World'
  , len = body.length;
var server = http.createServer(function(req, res){
  res.writeHead(200, { 'Content-Length': len });
  res.end(body);
});

cluster(server)
  .set('workers', 1)
  .use(cluster.reload(__dirname))
  .use(cluster.debug())
  .listen(3000);