
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http');

require('./common');

var server = http.createServer(function(req, res){
  res.writeHead(200);
  res.end('Hello World');
});

cluster = cluster(server)
  .listen(3000);

if (cluster.isChild) {
  cluster.on('listening', function(){
    process.env.should.have.property('FOO', 'bar');
    cluster.close();
  });
} else {
  process.env.FOO = 'bar';
  cluster.on('listening', function(){
    cluster.restart();
  });  
}

