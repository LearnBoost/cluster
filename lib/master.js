

/*!
 * Engine - Master
 * Copyright(c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Worker = require('./worker')
  , EventEmitter = require('events').EventEmitter
  , binding = process.binding('net')
  , os = require('os');

/**
 * Start a new `Master` with the given `server`.
 *
 * @param {http.Server} server
 * @return {Master}
 * @api public
 */

var Master = module.exports = function Master(server) {
  this.server = server;
  this.plugins = [];
  this.children = [];
  this.options = {};
  this.env = process.env.NODE_ENV || 'development';
  this.isWorker = !! process.env.ENGINE_MASTER_PID;
};

/**
 * Interit from `EventEmitter.prototype`.
 */

Master.prototype.__proto__ = EventEmitter.prototype;

/**
 * Defer `http.Server#listen()` call.
 *
 * @return {Master} for chaining
 * @api public
 */

Master.prototype.listen = function(){
  (this.isWorker ? new Worker(this) : this).start();
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
 * Use the given `plugin`.
 *
 * @param {Function} plugin
 * @return {Master} for chaining
 * @api public
 */

Master.prototype.use = function(plugin){
  this.plugins.push(plugin);
  if (!this.isWorker) plugin(this);
  return this;
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
  this.pid = process.env.ENGINE_MASTER_PID = process.pid;
  if (!this.has('workers')) this.workers(os.cpus().length);
  this.cmd = process.argv.slice(1);
  this.sock = binding.socket('tcp4'); // TODO: ipv6
  this.emit('start');
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
  while (n--) this.emit('worker', this.spawnWorker());
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
  var id = this.children.push(worker);
  worker.id = id;
  return worker;
};
