
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
} else if (cluster.isChild) {
  var err;
  try {
    // make sure the previous parent was killed
    process.kill(cluster.ppid, 0);
  } catch (e) {
    err = e;
  }
  if (!err) throw new Error('parent master(' + cluster.ppid + ') did not shut down');
  if ('ESRCH' != err.code) throw err;
}