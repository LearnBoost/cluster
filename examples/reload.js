
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http');

// try loading, and changing "Hello", to "Hello World"

var body = 'Hello'
  , len = body.length;
var server = http.createServer(function(req, res){
  res.writeHead(200, { 'Content-Length': len });
  res.end(body);
});

cluster(server)
  // lower worker count will reload faster,
  // however more will work just fine
  .set('workers', 1)
  .use(cluster.reload())
  .use(cluster.debug())
  .listen(3000);