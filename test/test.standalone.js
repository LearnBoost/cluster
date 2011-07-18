
/**
 * Module dependencies.
 */

var cluster = require('../');

require('./common');

cluster = cluster()
  .set('workers', 2)
  .start();

if (cluster.isWorker) {
  setTimeout(process.exit, Math.random() * 300);
} else {
  // make sure workers are re-spawned
  var n = 12;
  cluster.on('worker killed', function(worker){
    --n || process.exit();
  });
}