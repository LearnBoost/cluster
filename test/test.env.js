
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

if (cluster.isMaster) {
  process.env.FOO = 'bar';
} else {
  process.env.FOO.should.equal('bar');
}

cluster.on('listening', function(){
  cluster.close();
});