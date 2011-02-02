

/*!
 * Engine - Worker
 * Copyright(c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var spawn = require('child_process').spawn
  , binding = process.binding('net')
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
  this.server = master.server;
};

/**
 * Start worker.
 *
 * @api private
 */

Worker.prototype.start = function(){
  var self = this;
  this.stdin = new net.Socket(0, 'unix');
  this.getFD(function(fd){
    self.server.listenFD(fd);
  });
};

/**
 * Listen for `fd` and callback `fn(fd)`.
 *
 * @param {Function} fn
 * @api private
 */

Worker.prototype.getFD = function(fn){
  this.stdin.on('fd', fn).resume();
};

/**
 * Spawn the worker.
 *
 * @return {Worker} for chaining
 * @api private
 */

Worker.prototype.spawn = function(){
  var fds = binding.socketpair()
    , custom = [fds[0], 1, 2];

  // Spawn worker process
  this.proc = spawn(node, this.master.cmd, { customFds: custom });

  // Unix domain socket for ICP + fd passing
  this.sock = new net.Socket(fds[1], 'unix');
  return this;
};
