
/*!
 * Engine - Worker
 * Copyright(c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , spawn = require('child_process').spawn
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
 * Inherit from `EventEmitter.prototype`.
 */

Worker.prototype.__proto__ = EventEmitter.prototype;

/**
 * Worker is a receiver.
 */

require('./mixins/receiver')(Worker.prototype);

/**
 * Start worker.
 *
 * @api private
 */

Worker.prototype.start = function(){
  this.stdin = new net.Socket(0, 'unix');
  this.stdin.setEncoding('ascii');
  this.stdin.on('data', this.frameCommand.bind(this));
  this.stdin.on('fd', this.server.listenFD.bind(this.server));
  this.stdin.resume();
};

/**
 * Spawn the worker.
 *
 * @return {Worker} for chaining
 * @api private
 */

Worker.prototype.spawn = function(){
  var fds = binding.socketpair();

  // Spawn worker process
  this.proc = spawn(node, this.master.cmd, { customFds: [fds[0], -1, -1] });
  this.proc.stdin = new net.Socket(fds[0]);

  // Unix domain socket for ICP + fd passing
  this.sock = new net.Socket(fds[1], 'unix');
  return this;
};

/**
 * Send `cmd` with the given `args` to master.
 *
 * @param {String} cmd
 * @param {Mixed} args
 * @api public
 */

Worker.prototype.send = function(cmd, args){
  var json = JSON.stringify({ cmd: cmd, args: args });
  this.master.sock.write(json, 'ascii');
};

/**
 * Monitor requested.
 *
 * @api private
 */

Worker.prototype.monitor = function(){
  this.send('monitor', { type: 'connect' });
};

