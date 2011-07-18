
/**
 * Module dependencies.
 */

var cluster = require('../');

require('./common');

cluster = cluster()
  .set('workers', 1)
  .start();

if (cluster.isWorker) {
  setTimeout(function(){
    process.kill(process.env.CLUSTER_MASTER_PID, 'SIGQUIT');
  }, 500);
}