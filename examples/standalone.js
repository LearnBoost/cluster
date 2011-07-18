
/**
 * Module dependencies.
 */

var cluster = require('../');

var proc = cluster()
  .set('workers', 4)
  .use(cluster.debug())
  .start();

if (proc.isWorker) {
  var id = process.env.CLUSTER_WORKER;
  console.log('  worker #%d started', id);
  setInterval(function(){
    console.log('  processing job from worker #%d', id);
  }, 3000);
}