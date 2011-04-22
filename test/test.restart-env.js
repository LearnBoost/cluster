
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http')
  , assert = require('assert');

require('./common');

var server = http.createServer(function(req, res){
  res.writeHead(200);
  res.end('Hello World');
});

cluster = cluster(server)
  .listen(3001);

if (cluster.isChild) {
  process.cwd().should.include.string('cluster/test');
  cluster.on('listening', function(){
    assert.equal(require.paths.join(':'), process.env.REQUIRE_PATHS);
    assert.equal(process.env.FOO, 'bar');
    cluster.close();
  });
} else {
  process.env.REQUIRE_PATHS = require.paths.join(':');
  process.env.FOO = 'bar';
  cluster.on('listening', function(){
    cluster.restart();
  });  
}

