
/**
 * Module dependencies.
 */

var engine = require('../')
  , should = require('../support/should')
  , http = require('http')
  , fs = require('fs');

var server = http.createServer(function(req, res){
  console.log('%s %s', req.method, req.url);
  res.writeHead(200);
  res.end('Hello World');
});

engine = engine(server)
  .workers(1)
  .use(engine.logger())
  .listen(3000);

engine.on('listening', function(){
  http.get({ host: 'localhost', port: 3000 }, function(res){
    res.on('end', function(){
      var files = fs.readdirSync(__dirname + '/logs');
      files.should.have.length(4);
      files.should.contain('master.log');
      files.should.contain('worker.0.access.log');
      files.should.contain('worker.0.error.log');
      engine.close();
    });
  });
});