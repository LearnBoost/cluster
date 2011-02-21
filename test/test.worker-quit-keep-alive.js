
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

// request options

var options = {
    host: 'localhost'
  , port: 3000
  , headers: { Connection: 'keep-alive' }
};

// cluster

cluster = cluster(server)
  .set('workers', 1)
  .set('timeout', 1000)
  .listen(3000);

cluster.on('listening', function(){
  http.get(options, function(res){
    res.statusCode.should.equal(200);

    // kill the worker
    var pid = cluster.children[0].proc.pid;
    process.kill(pid, 'SIGQUIT');
  });
});

var timeout;

cluster.on('worker timeout', function(worker){
  worker.id.should.equal(0);
  timeout = true;
});

cluster.on('worker connected', function(worker){
  if (timeout) {
    worker.id.should.equal(0);
    http.get(options, function(res){
      res.statusCode.should.equal(200);
      cluster.close();
    });
  }
});