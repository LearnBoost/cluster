
/**
 * Module dependencies.
 */

var engine = require('../')
  , http = require('http');

var server = http.createServer(function(req, res){
  var body = 'Hello World';
  res.writeHead(200, { 'Content-Length': body.length });
  res.end(body);
});

engine(server)
  .chdir('/')
  .listen();