

/*!
 * Engine - Master
 * Copyright(c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var os = require('os')
  , Worker = require('./worker')
  , binding = process.binding('net');

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
  return new Worker(this).spawn(this.fds);
};
