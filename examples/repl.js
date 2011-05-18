
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http');

var server = http.createServer(function(req, res){
  console.log('%s %s', req.method, req.url);
  var body = 'Hello';
  res.writeHead(200, { 'Content-Length': body.length });
  res.end(body);
});

// custom repl function

cluster.repl.define('echo', function(master, sock, msg){
  sock.write(msg + '\n');
}, 'echo the given message');

// $ telnet localhots 8888
cluster(server)
  .set('workers', 4)
  .set('socket path', '/tmp')
  .use(cluster.logger('logs'))
  .use(cluster.stats({ connections: true, requests: true }))
  .use(cluster.repl(8888, '127.0.0.1'))
  .use(cluster.debug())
  .listen(3000);
