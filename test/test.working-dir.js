
/**
 * Module dependencies.
 */

var engine = require('../')
  , should = require('../support/should')
  , http = require('http');

var server = http.createServer(function(req, res){
  res.writeHead(200);
  res.end('Hello World');
});

engine = engine(server)
  .chdir('/')
  .listen(3000);

if (engine.isWorker) {
  process.cwd().should.equal('/');
}

engine.on('listening', function(){
  process.cwd().should.equal('/');
  engine.close();
});