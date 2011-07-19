
/**
 * Module dependencies.
 */

var cluster = require('../');

require('./common');
var assert = require('assert');

cluster = cluster()
  .set('workers', 2)
  .set('restart threshold', 0)
  .start();

if (!cluster.isMaster) return;
var ppid = process.env.CLUSTER_PARENT_PID;

cluster.on('listening', function(){
  if (ppid) return cluster.close();
  cluster.restart();
  setTimeout(function() {
    throw new Error('Failed to kill parent master');
  }, 3000);
});
