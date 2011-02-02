

/*!
 * Engine - Worker
 * Copyright(c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var spawn = require('child_process').spawn
  , net = require('net');

/**
 * Node binary.
 */

var node = process.execPath

/**
 * Initialize a new `Worker` with the given `master`.
 *
 * @param {Master} master
 * @api private
 */

var Worker = module.exports = function Worker(master) {
  this.master = master;
};

/**
 * Spawn the worker with custom `fds`.
 *
 * @return {Array} fds
 * @return {Worker} for chaining
 * @api private
 */

Worker.prototype.spawn = function(fds){
  // Spawn worker process
  var child = spawn(node, [__dirname + '/worker.js'], {
    customFds: [fds[0], 1, 2]
  });

  // Unix domain socket for ICP + fd passing
  this.sock = new net.Socket(fds[1], 'unix');
  return this;
};
