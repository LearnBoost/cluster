

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
  , ENOENT = require('constants').ENOENT
  , net = require('net')
  , fs = require('fs')
  , os = require('os');

/**
 * Start a new `Master` with the given `server`.
 *
 * Options:
 *
 *   - `workers`  Number of workers to spawn, defaults to the number of CPUs
 *   - 'working directory`  Working directory defaulting to '/'
 *   - 'backlog`  Connection backlog, defaulting to 128
 *
 * Events:
 *
 *   - `start`. When the server is starting (pre-spawn)
 *   - `worker`. When a worker is spawned, passing the `worker`
 *   - `listening`. When the server is listening for connections (post-spawn)
 *   - `broadcast`. When master is broadcasting a `cmd` with `args`
 *   - `closing`. When master is gracefully shutting down
 *   - `close`. When master has completed shutting down
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
  this.options = { 'working directory': '/', backlog: 128 };
  this.children = [];
  this.env = process.env.NODE_ENV || 'development';
  this.isWorker = !! process.env.ENGINE_MASTER_PID;
  this.pid = process.env.ENGINE_MASTER_PID = process.pid;
  this.cmd = process.argv.slice(1);
  this.dir = dirname(this.cmd[0]);
  this.customFds = [1, 2];
  this.sockPath = '/tmp/engine.sock'; // TODO: options
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
  return resolve(this.dir, path);
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
    this.sock = net.createConnection(this.sockPath);
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
  process.on('SIGINT', self.destroy.bind(self));
  process.on('SIGTERM', self.destroy.bind(self));
  process.on('SIGQUIT', self.close.bind(self));
  process.on('SIGHUP', function(){});

  // Default worker to the # of cpus
  this.has('workers') || this.set('workers', os.cpus().length);

  // TCP server for IPC
  this._server.listen(this.sockPath, function(){
    self.emit('start');

    // change working dir
    process.chdir(self.options['working directory']);

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
  var json = JSON.stringify({ method: 'connect', args: worker.id });
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
  this.state = 'close';
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
  this.state = 'destroy';
  this._destroy();
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
    --this.pendingWorkers || function(){
      // TODO: abstract
      if ('string' == typeof self.port) {
        fs.stat(self.port, function(err){
          if (err) {
            if (ENOENT != err.errno) throw err;
            listen();
          } else {
            fs.unlink(self.port, function(err){
              if (err) throw err;
              listen();
            });
          }
        });
      } else {
        listen();
      }
      
      // TODO: abstract
      function listen() {
        binding.bind(self.fd, self.port, self.host);
        binding.listen(self.fd, self.options.backlog);
        self.callback && self.callback();
        self.emit('listening');
      }
    }();
  }
};

/**
 * Received worker killed.
 *
 * @api private
 */

Master.prototype.workerKilled = function(worker){
  this.emit('worker killed', worker);
  switch (this.state) {
    case 'destroy':
      // ignore
      break;
    case 'close':
      --this.pendingDeaths || this._destroy();
      break;
    default:
      this.removeWorker(worker.id);
      this.spawnWorker(worker.id);
  }
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
  this.emit('kill', sig);
  this.children.forEach(function(worker){
    worker.proc.kill(sig);
  });
};

/**
 * Receive ping from worker, reply with pong.
 *
 * @param {Worker} worker
 * @api private
 */

Master.prototype.ping = function(worker){
  this.emit('pong', worker);
  worker.call('pong');
};
