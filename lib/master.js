

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
  , dirname = require('path').dirname
  , resolve = require('path').resolve
  , net = require('net')
  , os = require('os');

/**
 * Start a new `Master` with the given `server`.
 *
 * @param {http.Server} server
 * @return {Master}
 * @api public
 */

var Master = module.exports = function Master(server) {
  var self = this;
  this.server = server;
  this.plugins = [];
  this.options = {};
  this.children = [];
  this.env = process.env.NODE_ENV || 'development';
  this.isWorker = !! process.env.ENGINE_MASTER_PID;
  this.pid = process.env.ENGINE_MASTER_PID = process.pid;
  this.cmd = process.argv.slice(1);
  this.dir = dirname(this.cmd[0]);
  this.fd = binding.socket('tcp4'); // TODO: ipv6
  this.sockPath = process.env.ENGINE_MASTER_SOCK = '/tmp/engine.sock'; // TODO: options
  this.sock = net.createServer(function(sock){
    sock.on('data', self.frameCommand.bind(self));
  });
};

/**
 * Interit from `EventEmitter.prototype`.
 */

Master.prototype.__proto__ = EventEmitter.prototype;

/**
 * Worker is a receiver.
 */

require('./mixins/receiver')(Master.prototype);

/**
 * Resolve `path` relative to the server file being executed.
 *
 * @param {String} path
 * @return {String}
 * @api public
 */

Master.prototype.resolve = function(path){
  return resolve(this.dir, path);
};

/**
 * Defer `http.Server#listen()` call.
 *
 * @return {Master} for chaining
 * @api public
 */

Master.prototype.listen = function(){
  if (this.isWorker) {
    var worker = new Worker(this);
    this.sock.listen(this.sockPath, worker.start.bind(worker));
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
 *   - defaults workers to the number of CPUs available
 *   - creates listening socket
 *
 * @api private
 */

Master.prototype.start = function(){
  var self = this;
  this.has('workers') || this.workers(os.cpus().length);
  this.sock.listen(this.sockPath, function(){
    self.emit('start');
    self.spawn(self.options.workers);
    binding.bind(self.fd, 3000, '127.0.0.1'); // TODO: dynamic ... clean up
    binding.listen(self.fd, 128);
    self.emit('listening');
  });
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
  var worker = new Worker(this).spawn();
  var id = this.children.push(worker);
  worker.id = id;
  worker.sock.write('{}', 'ascii', this.fd);
  return worker;
};

/**
 * Broadcast `cmd` with the given `args` to each worker.
 *
 * @param {String} cmd
 * @param {Mixed} args
 * @api public
 */

Master.prototype.broadcast = function(cmd, args){
  var json = JSON.stringify({ cmd: cmd, args: args });
  this.children.forEach(function(worker){
    worker.sock.write(json, 'ascii');
  }, this);
};

/**
 * Send `sig` to all worker processes, defaults to __SIGTERM__.
 *
 * @param {String} sig
 * @api public
 */

Master.prototype.kill = function(sig){
  this.children.forEach(function(worker){
    worker.proc.kill(sig);
  });
};

/**
 * Kill all workers.
 *
 * @api public
 */

Master.prototype.close = function(){
  this.kill();
};
