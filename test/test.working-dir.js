
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
  .set('working directory', '/')
  .listen(3000);

if (cluster.isWorker) {
  process.cwd().should.equal('/');
}

cluster.on('listening', function(){
  process.cwd().should.equal('/');
  cluster.close();
});