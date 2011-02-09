
/**
 * Module dependencies.
 */

var engine = require('../')
  , http = require('http');

var server = http.createServer(function(req, res){
  if (5 == (Math.random() * 10 | 0)) throw new Error('failed!');
  console.log('%s %s', req.method, req.url);
  var body = 'Hello World';
  res.writeHead(200, { 'Content-Length': body.length });
  res.end(body);
});

engine(server)
  .use(engine.debug())
  .use(engine.logger())
  .use(engine.stats())
  .use(engine.repl(__dirname + '/repl'))
  .listen(3000);