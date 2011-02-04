
/**
 * Module dependencies.
 */

var engine = require('../')
  , assert = require('assert')
  , http = require('http')
  , fs = require('fs');

var master = __dirname + '/logs/master.log'
  , workerAccess = __dirname + '/logs/worker.0.access.log'
  , workerError = __dirname + '/logs/worker.0.error.log';

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
    res.on('data', function(chunk){
      assert.equal('Hello World', chunk.toString());
    });
    res.on('end', function(){
      var files = fs.readdirSync(__dirname + '/logs');
      assert.equal(4, files.length);
      engine.close();
    });
  });
});