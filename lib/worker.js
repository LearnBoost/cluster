

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
 * Frame incoming command, buffering the given `chunk`
 * until a frame is complete.
 *
 * @param {String} chunk
 * @api private
 */

Worker.prototype.frameCommand = function(chunk){
  this.buf = this.buf || '';
  this.braces = this.braces || 0;

  // buffer input
  this.buf += chunk;

  // count {
  var i = 0;
  while (~(i = chunk.indexOf('{', i))) ++i, ++this.braces;

  // count }
  var i = 0;
  while (~(i = chunk.indexOf('}', i))) ++i, --this.braces;

  // complete
  if (0 == this.braces) {
    var obj = JSON.parse(this.buf);
    this.buf = '';
    this.invokeCommand(obj.cmd, obj.args);
  }
};

/**
 * Invoke `cmd` with the given `args`.
 *
 * @param {String} cmd
 * @param {Mixed} args
 * @api private
 */

Worker.prototype.invokeCommand = function(cmd, args){
  if (!cmd) return;
  if (!Array.isArray(args)) args = [args];
  this[cmd].apply(this, args);
};

Worker.prototype.monitor = function(sock){
  console.log(sock);
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
