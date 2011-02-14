
/**
 * Module dependencies.
 */

var cluster = require('../')
  , should = require('../support/should')
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

function getPID(name) {
  var pid = fs.readFileSync(__dirname + '/pids/' + name, 'ascii');
  return parseInt(pid, 10);
}

cluster.on('listening', function(){
  fs.readdir(__dirname + '/pids', function(err, files){
    var options = { host: 'localhost', port: 3000 }
      , a = getPID('worker.0.pid')
      , b = getPID('worker.1.pid');

    // issue some requests
    var n = 20
      , pending = n;
    while (n--) {
      http.get(options, function(res){
        res.statusCode.should.equal(200);
        --pending || done();
      });
    }

    function done() {
      cluster.restart();
      http.get(options, function(res){
        res.statusCode.should.equal(200);
        a.should.not.equal(getPID('worker.0.pid'));
        b.should.not.equal(getPID('worker.1.pid'));
        cluster.close();
      });
    }
  });
});