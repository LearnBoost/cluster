
/**
 * Module dependencies.
 */

var cluster = require('../');

var proc = cluster()
  .set('workers', 4)
  .use(cluster.debug())
  .start();

if (proc.isWorker) {
  console.log('  worker #%d started', process.env.CLUSTER_WORKER);
  setInterval(function(){
    console.log('  processing job from worker #%d', process.env.CLUSTER_WORKER);
  }, 1000);
}