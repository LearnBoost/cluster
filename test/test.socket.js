
/**
 * Module dependencies.
 */

var cluster = require('../')
  , assert = require('assert')
  , fs = require('fs')
  , http = require('http');

require('./common');

var server = http.createServer(function(req, res){
  res.writeHead(200);
  res.end('Hello World');
});

cluster = cluster(server)
  .set('socket path', './test/support/')
  .set('socket filename', 'foo.sock')
  .listen(3000);

cluster.on('listening', function(){
  fs.readdir(__dirname + '/support', function(err, files){
    files.should.contain('foo.sock');
    cluster.close();
  });
});