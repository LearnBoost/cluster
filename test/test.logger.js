
/**
 * Module dependencies.
 */

var cluster = require('../')
  , should = require('../support/should')
  , http = require('http')
  , fs = require('fs');

var server = http.createServer(function(req, res){
  console.log('%s %s', req.method, req.url);
  res.writeHead(200);
  res.end('Hello World');
});

cluster = cluster(server)
  .set('workers', 1)
  .use(cluster.logger())
  .listen(3000);

cluster.on('listening', function(){
  http.get({ host: 'localhost', port: 3000 }, function(res){
    res.on('end', function(){
      var files = fs.readdirSync(__dirname + '/logs');
      files.should.have.length(5);
      files.should.contain('master.log');
      files.should.contain('worker.0.access.log');
      files.should.contain('worker.0.error.log');
      cluster.close();
    });
  });
});