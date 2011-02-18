
/**
 * Module dependencies.
 */

var cluster = require('../')
  , net = require('net');

var server = net.createServer(function(sock){
  sock.write('echo server of amazingness\n');
  sock.pipe(sock);
});

cluster(server)
  .set('workers', 4)
  .use(cluster.debug())
  .use(cluster.stats())
  .use(cluster.repl(8888))
  .listen(3000);
