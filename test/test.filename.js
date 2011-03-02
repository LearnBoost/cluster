
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http');

require('./common');


cluster = cluster('support/exported')
  .set('workers', 4)
  .listen(3000);

cluster.on('listening', function(){
  process.cwd().should.include.string('cluster/test');
  http.get({ host: 'localhost', port: 3000 }, function(res){
    res.on('data', function(chunk){
      chunk.toString().should.equal('Hello World');
    });
    res.on('end', function(){
      cluster.close();
    });
  });
});