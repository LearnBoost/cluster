
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
  var self = this;

  // stdin
  this.stdin = new net.Socket(0, 'unix');
  this.stdin.setEncoding('ascii');
  this.stdin.on('fd', this.server.listenFD.bind(this.server));
  this.stdin.on('data', function(chunk){
    self.frameCommand(self.master.sock, chunk);
  });
  this.stdin.resume();

  // signal handlers
  process.on('SIGINT', this.kill.bind(this));
  process.on('SIGTERM', this.kill.bind(this));
  process.on('SIGHUP', this.shutdown.bind(this));
  process.on('SIGQUIT', this.shutdown.bind(this));

  // ping master
  setInterval(this.ping.bind(this), 20000); // TODO: options
};

/**
 * Immediate shutdown.
 *
 * @api private
 */

Worker.prototype.kill = function(){
  process.exit();
};

/**
 * Perform graceful shutdown.
 *
 * @api private
 */

Worker.prototype.shutdown = function(){
  // TODO: notify master
  // TODO: notify master for logging
  var server = this.server;
  if (server.connections) {
    server.watcher.stop();
    setInterval(function(self){
      server.connections || self.kill();
    }, 500, this);
  } else {
    this.kill();
  }
};

/**
 * Ping master.
 *
 * @api private
 */

Worker.prototype.ping = function(){
  this.send('ping');
  this.pongTimeout = setTimeout(this.shutdown.bind(this), 10000, this);
};

/**
 * Receive pong from master.
 *
 * @api private
 */

Worker.prototype.pong = function(){
  clearTimeout(this.pongTimeout);
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
