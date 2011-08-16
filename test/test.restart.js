
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
  .listen(3002);

var a, b
  , options = { host: 'localhost', port: 3002 };

function getPID(name) {
  var pid = fs.readFileSync(__dirname + '/pids/' + name, 'ascii');
  return parseInt(pid, 10);
}

function movePID(name) {
  var pid = getPID(name);
  fs.writeFileSync(__dirname + '/pids/old.' + name, pid.toString(), 'ascii');
}

if (cluster.isChild) {
  cluster.on('restart', function(){
    http.get(options, function(res){
      res.statusCode.should.equal(200);
      var a = getPID('old.worker.0.pid')
        , b = getPID('old.worker.1.pid');
      a.should.not.equal(getPID('worker.0.pid'));
      b.should.not.equal(getPID('worker.1.pid'));
      cluster.close();
    });
  });
} else {
  var pending = 2;
  cluster.on('worker pidfile', function(){
    --pending || (function(){
      movePID('worker.0.pid')
      movePID('worker.1.pid');

      // issue some requests
      var n = 20
        , pending = n;
      while (n--) {
        http.get(options, function(res){
          res.statusCode.should.equal(200);
          --pending || cluster.restart();
        });
      }
    })();
  });
}