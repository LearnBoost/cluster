
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http')
  , fs = require('fs');

require('./common');

var server = http.createServer(function(req, res){
  setTimeout(function(){
    res.writeHead(200);
    res.end('Hello World');
  }, 1000);
});

cluster = cluster(server)
  .set('workers', 2)
  .use(cluster.pidfiles())
  .listen(3000);

function checkFile(name) {
  var pid = fs.readFileSync(__dirname + '/pids/' + name, 'ascii');
  (!isNaN(parseInt(pid, 10))).should.be.true;
}

cluster.on('listening', function(){
  fs.readdir(__dirname + '/pids', function(err, files){
    // TODO: test master pid
    files.should.contain('worker.0.pid');
    files.should.contain('worker.1.pid');
    checkFile('worker.0.pid');
    checkFile('worker.1.pid');
    cluster.close();
  });
});