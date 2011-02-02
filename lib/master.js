

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
  // Worker process
  if (process.env.ENGINE_MASTER_PID) {
    console.log('child');
  } else {
    this.start();
  }
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
 *   - set __ENGINE_MASTER_PID__
 *   - defaults workers to the number of CPUs available
 *   - creates listening socket
 *
 * @api private
 */

Master.prototype.start = function(){
  process.env.ENGINE_MASTER_PID = process.pid;
  if (!this.has('workers')) this.workers(os.cpus().length);
  this.cmd = process.argv.slice(1);
  this.sock = binding.socket('tcp4'); // TODO: ipv6
  this.spawn(this.options.workers);
  binding.bind(this.sock, 3000, '127.0.0.1'); // TODO: dynamic ... clean up
  binding.listen(this.sock, 128);
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
 * @return {Worker}
 * @api public
 */

Master.prototype.spawnWorker = function(){
  var fds = binding.socketpair()
    , worker = new Worker(this).spawn(fds);
  worker.sock.write('test', 'ascii', this.sock);
  this.children.push(worker);
  return worker;
};
