
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http');

var server = http.createServer(function(req, res){
  console.log('%s %s', req.method, req.url);
  var body = 'Hello World';
  res.writeHead(200, { 'Content-Length': body.length });
  res.end(body);
});

// custom repl function

cluster.repl.define('echo', function(master, sock, msg){
  sock.write(msg + '\n');
}, 'echo the given message');

// $ telnet /path/to/examples/repl

cluster(server)
  .set('workers', 1)
  .use(cluster.logger())
  .use(cluster.repl('/tmp/repl'))
  .listen(3000);