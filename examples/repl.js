
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

// $ telnet /path/to/examples/repl

engine(server)
  .use(engine.logger('logs'))
  .use(engine.stats())
  .use(engine.repl(__dirname + '/repl'))
  .listen();