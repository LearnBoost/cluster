
/*!
 * Cluster - Master
 * Copyright(c) 2011 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Worker = require('./worker')
  , EventEmitter = require('events').EventEmitter
  , binding = process.binding('net')
  , dirname = require('path').dirname
  , ENOENT = process.version >= 'v0.4.0'
    ? require('constants').ENOENT
    : process.ENOENT
  , net = require('net')
  , fs = require('fs')
  , os;

// COMPAT:

try {
  os = require('os');
} catch (err) {
  // ignore
}

/**
 * Start a new `Master` with the given `server`.
 *
 * Options:
 *
 *   - `workers`  Number of workers to spawn, defaults to the number of CPUs
 *   - 'working directory`  Working directory defaulting to '/'
 *   - 'backlog` Connection backlog, defaulting to 128
 *   - 'socket path` Master socket path defaulting to `./master.sock`
 *   - 'timeout` Worker shutdown timeout in milliseconds, defaulting to 60000
 *   - 'user` User id / name
 *   - 'group` Group id / name
 *
 * Events:
 *
 *   - `start`. When the server is starting (pre-spawn)
 *   - `worker`. When a worker is spawned, passing the `worker`
 *   - `listening`. When the server is listening for connections (post-spawn)
 *   - `closing`. When master is gracefully shutting down
 *   - `close`. When master has completed shutting down
 *   - `worker killed`. When a worker has died
 *   - `kill`. When a `signal` is being sent to all workers
 *   - `restart`. Restart requested by REPL or signal
 *
 * Signals:
 *
 *   - `SIGINT`   hard shutdown
 *   - `SIGTERM`  hard shutdown
 *   - `SIGQUIT`  graceful shutdown
 *   - `SIGUSR2`  restart workers
 *   - `SIGHUP`   restart workers
 *
 * @param {http.Server} server
 * @return {Master}
 * @api public
 */

var Master = module.exports = function Master(server) {
  var self = this;
  this.server = server;
  this.plugins = [];

  // grab server root
  this.cmd = process.argv.slice(1);
  this.dir = dirname(this.cmd[0]);

  // defaults
  this.options = {
      'backlog': 128
    , 'working directory': '/'
    , 'socket path': this.resolve('master.sock')
    , 'timeout': 60000
  };

  this.children = [];
  this.env = process.env.NODE_ENV || 'development';
  this.isWorker = !! process.env.ENGINE_MASTER_PID;
  this.isMaster = ! this.isWorker;
  this.pid = process.env.ENGINE_MASTER_PID = process.pid;
  this.customFds = [1, 2];
  this.state = 'active';
  this._server = net.createServer(function(sock){
    sock.setEncoding('ascii');
    sock.on('data', self.frame.bind(self));
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
  return '/' == path[0]
    ? path
    : this.dir + '/' + path;
};

/**
 * Invoke masters's `method` with worker `id`. (called from Worker)
 *
 * @param {Number} id
 * @param {String} method
 * @param {...} args
 * @api private
 */

Master.prototype.call = function(id, method){
  var args = Array.prototype.slice.call(arguments)
    , id = args.shift()
    , method = args.shift();
  this.sock.write(JSON.stringify({
      method: method
    , args: args
    , id: id
  }), 'ascii');
};

/**
 * Defer `http.Server#listen()` call.
 *
 * @param {Number|String} port or unix domain socket path
 * @param {String|Function} host or callback
 * @param {Function} callback
 * @return {Master} for chaining
 * @api public
 */

Master.prototype.listen = function(port, host, callback){
  if (this.isWorker) {
    var worker = new Worker(this);
    this.sock = net.createConnection(this.options['socket path']);
    this.sock.on('connect', function(){
      worker.start();
    });
  } else {
    this.port = port;
    if ('function' == typeof host) callback = host, host = null;
    this.host = host;
    this.callback = callback;
    this.start();
  }
  return this;
};

/**
 * Set option `key` to `val`.
 *
 * @param {String} key
 * @param {Mixed} val
 * @return {Master} for chaining
 * @api public
 */

Master.prototype.set = function(key, val){
  this.options[key] = val;
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

  // listen sock
  if (this.host) {
    this.fd = binding.socket('tcp' + net.isIP(this.host));
  } else if ('string' == typeof this.port) {
    this.fd = binding.socket('unix');
  } else if (this.port) {
    this.fd = binding.socket('tcp4');
  }

  // signal handlers
  process.on('SIGINT', this.destroy.bind(this));
  process.on('SIGTERM', this.destroy.bind(this));
  process.on('SIGQUIT', this.close.bind(this));
  process.on('SIGUSR2', this.restart.bind(this));
  process.on('SIGHUP', this.restart.bind(this));

  // Default worker to the # of cpus
  if (!this.has('workers')) {
    this.set('workers', os
      ? os.cpus().length
      : 1);
  }

  // TCP server for IPC
  this._server.listen(this.options['socket path'], function(){
    self.emit('start');

    // change working dir
    process.chdir(self.options['working directory']);

    // user
    var user = self.options.user;
    if (user) process.setuid(user);

    // group
    var group = self.options.group;
    if (group) process.setgid(group);

    // spawn workers
    self.spawn(self.options.workers);

    // set # of pending workers
    self.starting = true;
    self.pendingWorkers = self.options.workers;
  });
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
 * Spawn a worker with optional `id`.
 *
 * @param {Number} id
 * @return {Worker}
 * @api private
 */

Master.prototype.spawnWorker = function(id){
  var worker = new Worker(this).spawn();

  // id given
  if ('number' == typeof id) {
    this.children[id] = worker;
    worker.id = id;
  // generate an id
  } else {
    var len = this.children.push(worker);
    worker.id = len - 1;
  }

  // TODO: refactor
  var json = JSON.stringify({
      method: 'connect'
    , args: [worker.id, this.options.timeout]
  });
  worker.sock.write(json, 'ascii', this.fd);

  // emit
  this.emit('worker', worker);

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

Master.prototype.close = function(){
  this.emit('closing');
  this.kill('SIGQUIT');
  this.state = 'graceful shutdown';
  this.pendingDeaths = this.children.length;
};

/**
 * Hard shutdwn, immediately kill all workers.
 *
 * @api public
 */

Master.prototype.destroy = function(){
  this.emit('closing');
  this.kill('SIGKILL');
  this.state = 'hard shutdown';
  this._destroy();
};


/**
 * Restart all workers, by sending __SIGQUIT__
 * or `sig` to them, enabling master to re-spawn.
 *
 * @param {String} sig
 * @api public
 */

Master.prototype.restart = function(sig){
  this.emit('restart');
  this.state = 'restarting';
  this.kill(sig || 'SIGQUIT');
  this.pendingDeaths = this.children.length;
};

/**
 * Immediate shutdown, used by `Master#close()`
 * and `Master#destroy()` when all workers have shutdown.
 *
 * @api private
 */

Master.prototype._destroy = function(){
  var self = this;
  self._server.close();
  if ('string' == typeof self.port) {
    fs.unlink(self.port, function(){
      self.emit('close');
    });
  } else {
    self.emit('close');
  }
};

/**
 * Worker is connected, on boot
 * wait for all workers to connect,
 * then emit the 'listening' event.
 *
 * @param {Worker} worker
 * @api private
 */

Master.prototype.connect = function(worker){
  var self = this;
  this.emit('worker connected', worker);
  if (this.starting) {
    --this.pendingWorkers || this.startListening();
  }
};

/**
 * Start listening.
 *
 * @api private
 */

Master.prototype.startListening = function(){
  var self = this;

  // remove unix domain socket 
  if ('string' == typeof this.port) {
    fs.unlink(this.port, function(err){
      if (ENOENT != err.errno) throw err;
      listen();
    });
  } else {
    listen();
  }

  // bind / listen
  function listen() {
    binding.bind(self.fd, self.port, self.host);
    binding.listen(self.fd, self.options.backlog);
    self.callback && self.callback();
    self.emit('listening');
  }
};

/**
 * Received worker killed.
 *
 * @api private
 */

Master.prototype.workerKilled = function(worker){
  this.emit('worker killed', worker);

  // always remove worker
  this.removeWorker(worker.id);

  // state specifics
  switch (this.state) {
    case 'hard shutdown':
      // ignore
      break;
    case 'graceful shutdown':
      --this.pendingDeaths || this._destroy();
      break;
    case 'restarting':
      --this.pendingDeaths || (this.state = 'active');
    default:
      this.spawnWorker(worker.id);
  }
};

/**
 * Received worker timeout.
 * 
 * @api private
 */

Master.prototype.workerTimeout = function(worker, timeout){
  this.emit('worker timeout', worker, timeout);
};

/**
 * Worker waiting on `connections` to close.
 * 
 * @api private
 */

Master.prototype.workerWaiting = function(worker, connections){
  this.emit('worker waiting', worker, connections);
};

/**
 * Remove worker `id`.
 *
 * @param {Number} id
 * @api public
 */

Master.prototype.removeWorker = function(id){
  delete this.children[id];
};

/**
 * Send `sig` to all worker processes, defaults to __SIGTERM__.
 *
 * @param {String} sig
 * @api public
 */

Master.prototype.kill = function(sig){
  var self = this;
  this.emit('kill', sig);
  this.children.forEach(function(worker){
    worker.proc.kill(sig);
  });
};