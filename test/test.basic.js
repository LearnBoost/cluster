
/**
 * Module dependencies.
 */

var engine = require('../')
  , assert = require('assert')
  , http = require('http');

var server = http.createServer(function(req, res){
  res.writeHead(200);
  res.end('Hello World');
});

engine = engine(server)
  .use(engine.debug())
  .listen(3000);

engine.on('listening', function(){
  http.get({ host: 'localhost', port: 3000 }, function(res){
    res.on('data', function(chunk){
      assert.equal('Hello World', chunk.toString());
    });
    res.on('end', function(){
      engine.close();
    });
  });
});