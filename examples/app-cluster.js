/**
 * Module dependencies.
 */

var cluster = require('../');

// $ telnet localhost 8888

cluster('app.js')
  .set('workers', 4)
  .use(cluster.logger('logs'))
  .use(cluster.stats({ connections: true, requests: true }))
  .use(cluster.repl(8888, '127.0.0.1'))
  .use(cluster.debug())
  .listen(3000);