
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
  .set('workers', 1)
  .listen(3000);

cluster.on('listening', function(){
  http.get({ host: 'localhost', port: 3000 }, function(res){
    res.statusCode.should.equal(200);

    // kill the worker
    var pid = cluster.children[0].proc.pid;
    process.kill(pid, 'SIGKILL');
  });
});

cluster.on('worker killed', function(worker){
  worker.id.should.equal(0);
  http.get({ host: 'localhost', port: 3000 }, function(res){
    res.statusCode.should.equal(200);
    cluster.close();
  });
});
