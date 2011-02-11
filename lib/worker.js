
/*!
 * Cluster - Worker
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
 * Signals:
 *
 *   - `SIGINT`   immediately exit
 *   - `SIGTERM`  immediately exit
 *   - `SIGHUP`   graceful exit
 *   - `SIGQUIT`  graceful exit
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
  var self = this
    , call = this.master.call;

  // proxy to provide worker id
  this.master.call = function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift(self.id);
    return call.apply(this, args);
  };

  // stdin
  this.stdin = new net.Socket(0, 'unix');
  this.stdin.setEncoding('ascii');
  this.stdin.on('fd', this.server.listenFD.bind(this.server));
  this.stdin.on('data', this.frame.bind(this));
  this.stdin.resume();

  // signal handlers
  process.on('SIGINT', this.kill.bind(this));
  process.on('SIGTERM', this.kill.bind(this));
  process.on('SIGHUP', this.close.bind(this));
  process.on('SIGQUIT', this.close.bind(this));
  process.on('uncaughtException', function(err){
    console.error(err.stack || err.message);
    self.kill();
  });
};

/**
 * Received connect event, set the worker id.
 *
 * @param {String} id
 * @api private
 */

Worker.prototype.connect = function(id){
  this.id = parseInt(id, 10);

  // notify master of connection
  this.master.call('connect');

  // ping master
  this.pingInterval = setInterval(this.ping.bind(this), 20000); // TODO: options
};

/**
 * Immediate shutdown.
 *
 * @api private
 */

Worker.prototype.kill = function(){
  this.master.call('workerKilled');
  process.exit();
};

/**
 * Perform graceful shutdown.
 *
 * @api private
 */

Worker.prototype.close = function(){
  var self = this
    , server = this.server;
  clearInterval(this.pingInterval);
  clearTimeout(this.pingTimeout);
  if (server.connections) {
    server.watcher.stop();
    setInterval(function(self){
      self.master.call('workerWaiting', server.connections);
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
  console.error('send PING');
  this.master.call('ping');
  this.pongTimeout = setTimeout(function(self){
    console.error('PONG timeout, shutting down.');
    self.close();
  }, 10000, this);
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
  var fds = binding.socketpair()
    , customFds = [fds[0]].concat(this.master.customFds);

  // Spawn worker process
  this.proc = spawn(node, this.master.cmd, { customFds: customFds });
  this.proc.stdin = new net.Socket(fds[0]);

  // Unix domain socket for ICP + fd passing
  this.sock = new net.Socket(fds[1], 'unix');
  return this;
};

/**
 * Invoke worker's `method` (called from Master).
 *
 * @param {String} method
 * @param {...} args
 * @api private
 */

Worker.prototype.call = function(method){
  var args = Array.prototype.slice.call(arguments)
    , method = args.shift();
  this.sock.write(JSON.stringify({
      method: method
    , args: args
  }), 'ascii');
};
