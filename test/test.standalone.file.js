
/**
 * Module dependencies.
 */

var cluster = require('../');

cluster = cluster('./support/standalone')
  .set('workers', 4)
  .start();

if (cluster.isMaster) {
  setTimeout(function(){
    process.kill(process.pid, 'SIGQUIT');
  }, 500);
}