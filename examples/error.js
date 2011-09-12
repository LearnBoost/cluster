
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http');

var server = http.createServer(function(req, res){
  if (5 == (Math.random() * 10 | 0)) throw new Error('failed!');
  console.log('%s %s', req.method, req.url);
  var body = 'Hello World';
  res.writeHead(200, { 'Content-Length': body.length });
  res.end(body);
});

var proc = cluster(server)
  .use(cluster.debug())
  .use(cluster.stats())
  .use(cluster.repl(__dirname + '/repl'))
  .listen(3000);

if (proc.isWorker) {
  // you can register your own exceptionHandler
  // which will prevent Cluster from add its own. This
  // means the workers will be harder to kill, however
  // if you do not employ additional logic, connections
  // will remain open until timeout.
  process.on('uncaughtException', function(err){
    console.error(err);
  });
}