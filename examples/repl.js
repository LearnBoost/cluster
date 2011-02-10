
/**
 * Module dependencies.
 */

var engine = require('../')
  , http = require('http');

var server = http.createServer(function(req, res){
  console.log('%s %s', req.method, req.url);
  var body = 'Hello World';
  res.writeHead(200, { 'Content-Length': body.length });
  res.end(body);
});

// custom repl function

engine.repl.define('echo', function(master, sock, msg){
  sock.write(msg + '\n');
}, 'echo the given message');

// $ telnet localhots 8888

engine(server)
  .use(engine.logger('logs'))
  .use(engine.stats())
  .use(engine.repl(8888))
  .use(engine.debug())
  .listen(3000);