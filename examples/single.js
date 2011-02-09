
/**
 * Module dependencies.
 */

var engine = require('../')
  , http = require('http');

var body = 'Hello World'
  , len = body.length;
var server = http.createServer(function(req, res){
  res.writeHead(200, { 'Content-Length': len });
  res.end(body);
});

engine(server)
  .set('working directory', '/')
  .set('workers', 1)
  .listen(3000);