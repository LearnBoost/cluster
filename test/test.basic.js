
/**
 * Module dependencies.
 */

var cluster = require('../')
  , should = require('../support/should')
  , http = require('http');

var server = http.createServer(function(req, res){
  res.writeHead(200);
  res.end('Hello World');
});

cluster = cluster(server)
  .listen(3000);

cluster.on('listening', function(){
  http.get({ host: 'localhost', port: 3000 }, function(res){
    res.on('data', function(chunk){
      chunk.toString().should.equal('Hello World');
    });
    res.on('end', function(){
      cluster.close();
    });
  });
});