
/**
 * Module dependencies.
 */

var cluster = require('../')
  , http = require('http')
  , app = http.createServer();

cluster(app)
  .set('workers', 2)
  .listen(0)
  .on('listening', process.exit);

