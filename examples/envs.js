
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http');

var body = 'Hello World'
  , len = body.length;
var server = http.createServer(function(req, res){
  res.writeHead(200, { 'Content-Length': len });
  res.end(body);
});

cluster(server)
  .set('working directory', '/')
  .in('production').set('workers', 4)
  .in('development').set('workers', 1)
  .in('production').use(cluster.logger())
  .in('production').use(cluster.pidfiles())
  .in('development').use(cluster.logger('logs', 'debug'))
  .in('development').use(cluster.debug())
  .in('production').listen(80)
  .in('development').listen(3000);
