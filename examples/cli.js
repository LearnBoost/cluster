
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

// Launch the cluster:
//   $ nohup node examples/cli.js &

// Check the status:
//   $ node examples/cli.js status

// View other commands:
//   $ node examples/cli.js --help

cluster(server)
  .use(cluster.pidfiles())
  .use(cluster.debug())
  .use(cluster.cli())
  .listen(80);
