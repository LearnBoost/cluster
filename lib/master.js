

/*!
 * Engine - Master
 * Copyright(c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var os = require('os')
  , spawn = require('child_process').spawn
  , binding = process.binding('net')
  , net = require('net');

/**
 * Node binary.
 */

var node = process.argv[0];

/**
 * Start a new `Master` with the given `server`.
 *
 * @param {http.Server} server
 * @return {Master}
 * @api public
 */

var Master = module.exports = function Master(server) {
  this.server = server;
  this.children = [];
  this.options = {};
};

/**
 * Defer `http.Server#listen()` call.
 *
 * @return {Master} for chaining
 * @api public
 */

Master.prototype.listen = function(){
  this.options.listen = arguments;
  this.start();
  return this;
};

/**
 * Set the number of works to `n`.
 *
 * @param {Number} n
 * @return {Master} for chaining
 * @api public
 */

Master.prototype.workers = function(n){
  this.options.workers = n;
  return this;
};

/**
 * Check if `option` has been set.
 *
 * @param {String} option
 * @return {Boolean}
 * @api public
 */

Master.prototype.has = function(option){
  return !! this.options[option];
};

/**
 * Start master process.
 *
 *   - defaults workers to the number of CPUs available
 *
 * @api private
 */

Master.prototype.start = function(){
  if (!this.has('workers')) this.workers(os.cpus().length);
  this.fds = binding.socketpair();
  this.spawn(this.options.workers);
};

/**
 * Spawn `n` workers.
 *
 * @param {Number} n
 * @api private
 */

Master.prototype.spawn = function(n){
  while (n--) this.spawnWorker();
};

/**
 * Spawn a worker.
 *
 * @api public
 */

Master.prototype.spawnWorker = function(){
  // Spawn worker process
  // TODO:
  var child = spawn(node, [__dirname + '/worker.js'], {
    customFds: [this.fds[0], 1, 2]
  });

  // UNIX Domain sock FD passing
  // TODO:
  var sock = new net.Socket(this.fds[1], 'unix');

  // Save the child for later
  this.children.push(child);
};



