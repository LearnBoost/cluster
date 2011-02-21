
/**
 * Module dependencies.
 */

var spawn = require('child_process').spawn
  , http = require('http');

require('./common');

var calls = 0;

// child process

var child = spawn('node', [__dirname + '/support/all.js'], {
  customFds: [-1, -1, 2]
});

// listening

child.stdout.on('data', function(chunk){
  var options = { host: 'localhost', port: 3000 };

  http.get(options, function(res){
    ++calls;
    res.statusCode.should.equal(200);
    child.kill('SIGQUIT');
  });
  
  http.get(options, function(res){
    ++calls;
    res.statusCode.should.equal(200);
  });
  
  http.get(options, function(res){
    ++calls;
    res.statusCode.should.equal(200);
  });
  
  http.get(options, function(res){
    ++calls;
    res.statusCode.should.equal(200);
  });
});

child.on('exit', function(){
  calls.should.equal(4);
});