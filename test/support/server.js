
/**
 * Module dependencies.
 */

var cluster = require('../../')
  , should = require('should')
  , http = require('http')
  , fs = require('fs');

require('../common');

var server = http.createServer(function(req, res){
  setTimeout(function(){
    res.writeHead(200);
    res.end('Hello World');
  }, 1000);
});

cluster = cluster(server)
  .set('workers', 2)
  .listen(3000);

cluster.on('listening', function(){
  console.log('listening');
});