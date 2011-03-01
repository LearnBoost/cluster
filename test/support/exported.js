
/**
 * Module dependencies.
 */

var http = require('http');

module.exports = http.createServer(function(req, res){
  res.writeHead(200);
  res.end('Hello World');
});