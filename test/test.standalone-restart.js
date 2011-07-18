
/**
 * Module dependencies.
 */

var cluster = require('../');

require('./common');

cluster = cluster()
  .set('workers', 2)
  .start();

if (cluster.isWorker) {
  setTimeout(function(){
    process.kill(process.env.CLUSTER_MASTER_PID, 'SIGUSR2');
  }, 200);
} else {
  if (process.env.CLUSTER_REPLACEMENT_MASTER) {
    var err;
    try {
      // make sure the previous parent was killed
      process.kill(process.env.PARENT_PID, 0);
    } catch (e) {
      err = e;
    }
    if (!err) throw new Error('parent is running');
    if ('ESRCH' != err.code) throw err;
  }
}