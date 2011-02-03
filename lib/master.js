

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
 * Events:
 *
 *   - `start`. When the server is starting (pre-spawn)
 *   - `worker`. When a worker is spawned, passing the `worker`
 *   - `listening`. When the server is listening for connections (post-spawn)
 *   - `broadcast`. When master is broadcasting a `cmd` with `args`
 *   - `shutdown`. When master is gracefully shutting down
 *   - `worker killed`. When a worker has died
 *   - `kill`. When a `signal` is being sent to all workers
 *
 * @param {http.Server} server
 * @return {Master}
 * @api public
 */

var Master = module.exports = function Master(server) {
  var self = this;
  this.server = server;
  this.plugins = [];
  this.options = { chdir: '/' };
  this.children = [];
  this.env = process.env.NODE_ENV || 'development';
  this.isWorker = !! process.env.ENGINE_MASTER_PID;
  this.pid = process.env.ENGINE_MASTER_PID = process.pid;
  this.cmd = process.argv.slice(1);
  this.dir = dirname(this.cmd[0]);
  this.customFds = [1, 2];
  this.fd = binding.socket('tcp4'); // TODO: ipv6
  this.sockPath = '/tmp/engine.sock'; // TODO: options
  // TODO: refactor / abstract IPC
  this._server = net.createServer(function(sock){
    self.emit('connection', sock);
    sock.setEncoding('ascii');
    sock.on('data', function(chunk){
      self.frameCommand(sock, chunk);
    });
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
    this.sock = net.createConnection(this.sockPath);
    this.sock.on('connect', function(){
      worker.start();
    });
  } else {
    this.start();
  }
  return this;
};

/**
 * Set the working directory to `dir`.
 *
 * @param {String} dir
 * @return {Master} for chaining
 * @api public
 */

Master.prototype.chdir = function(dir){
  this.options.chdir = dir;
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

  // signal handlers
  process.on('SIGINT', process.exit.bind(process));
  process.on('SIGTERM', process.exit.bind(process));
  process.on('SIGHUP', self.shutdown.bind(self));
  process.on('SIGQUIT', self.shutdown.bind(self));

  // Default worker to the # of cpus
  this.has('workers') || this.workers(os.cpus().length);

  // TCP server for IPC
  this._server.listen(this.sockPath, function(){
    self.emit('start');

    // change working dir
    process.chdir(self.options.chdir);

    // spawn workers
    self.spawn(self.options.workers);

    // start server
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
  this.emit('broadcast', cmd, args);
  this.children.forEach(function(worker){
    worker.sock.write(json, 'ascii');
  }, this);
};

/**
 * Graceful shutdown, wait for all workers
 * to reply before exiting.
 *
 * @api public
 */

Master.prototype.shutdown = function(){
  this.emit('shutdown');
  this.kill('SIGQUIT');
  this.shuttingdown = true;
  this.pendingDeaths = this.children.length;
};

/**
 * Received worker killed.
 *
 * @api private
 */

Master.prototype.workerKilled = function(){
  this.emit('worker killed');

  if (this.shuttingdown) {
    --this.pendingDeaths || process.exit();
    
  } else {
    // TODO: when IPC is fixed, remove associated worker
    this.spawn(1);
  }
};

/**
 * Send `sig` to all worker processes, defaults to __SIGTERM__.
 *
 * @param {String} sig
 * @api public
 */

Master.prototype.kill = function(sig){
  this.emit('kill', sig);
  this.children.forEach(function(worker){
    worker.proc.kill(sig);
  });
};

/**
 * Receive ping from worker, reply with pong.
 *
 * @param {Socket} sock
 * @api private
 */

Master.prototype.ping = function(sock){
  this.emit('pong', sock);
  sock.write(JSON.stringify({ cmd: 'pong' }));
};

/**
 * - Close master server.
 * - Kill all workers.
 *
 * @api public
 */

Master.prototype.close = function(){
  this._server.close();
  this.kill();
  this.emit('close');
};

