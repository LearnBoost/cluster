
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http')
  , fs = require('fs');

require('./common');

var server = http.createServer(function(req, res){
  console.log('%s %s', req.method, req.url);
  res.writeHead(200);
  res.end('Hello World');
});

cluster = cluster(server)
  .set('workers', 1)
  .use(cluster.logger(__dirname + '/logs/nested'))
  .listen(3000);

cluster.on('listening', function(){
  http.get({ host: 'localhost', port: 3000 }, function(res){
    res.on('end', function(){
      var files = fs.readdirSync(__dirname + '/logs/nested');
      files.should.have.length(4);
      files.should.contain('master.log');
      files.should.contain('workers.access.log');
      files.should.contain('workers.error.log');
      cluster.close();
    });
  });
});