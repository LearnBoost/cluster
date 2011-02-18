
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
  , spawn = require('child_process').spawn
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

// COMPAT:

net.Socket = net.Stream;

/**
 * Node binary.
 */

var node = process.execPath

/**
 * Start a new `Master` with the given `server`.
 *
 * Options:
 *
 *   - `workers`  Number of workers to spawn, defaults to the number of CPUs
 *   - 'working directory`  Working directory defaulting to '/'
 *   - 'backlog` Connection backlog, defaulting to 128
 *   - 'socket path` Master socket path defaulting to `./`
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
 *   - `restarting`. Restart requested by REPL or signal. Receives an object
 *      which can be patched in order to preserve plugin state.
 *   - `restart`. Restart complete, new master established, previous died.
 *      Receives an object with state preserved by the `restarting` event.
 *                
 * Signals:
 *
 *   - `SIGINT`   hard shutdown
 *   - `SIGTERM`  hard shutdown
 *   - `SIGQUIT`  graceful shutdown
 *   - `SIGUSR2`  graceful restart
 *   - `SIGHUP`   graceful restart
 *
 * @param {http.Server} server
 * @return {Master}
 * @api public
 */

var Master = module.exports = function Master(server) {
  var self = this;
  this.server = server;
  this.plugins = [];
  this.children = [];
  this.state = 'active';

  // grab server root
  this.cmd = process.argv.slice(1);
  this.dir = dirname(this.cmd[0]);

  // defaults
  this.options = {
      'backlog': 128
    , 'working directory': '/'
    , 'socket path': this.dir
    , 'timeout': 60000
  };

  // parent master pid
  this.ppid = process.env.CLUSTER_PARENT_PID
    ? parseInt(process.env.CLUSTER_PARENT_PID, 10)
    : null;

  // environment
  this.env = process.env.NODE_ENV || 'development';

  // process is a worker
  this.isWorker = !! process.env.CLUSTER_MASTER_PID;

  // process is a child (worker or master replacement)
  this.isChild = this.isWorker || !! process.env.CLUSTER_REPLACEMENT_MASTER;

  // process is master
  this.isMaster = ! this.isWorker;

  // process id
  this.pid = process.pid;
  if (this.isMaster) process.env.CLUSTER_MASTER_PID = this.pid;

  // custom worker fds, defaults to std{out,err}
  this.customFds = [1, 2];

  // tcp server for IPC
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
 * Return the path of the unix domain socket used for IPC.
 *
 * @return {String}
 * @api public
 */

Master.prototype.__defineGetter__('socketPath', function(){
  var pid = process.env.CLUSTER_MASTER_PID || this.pid;
  return this.options['socket path'] + '/cluster.' + pid + '.sock';
});

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
    this.sock = net.createConnection(this.socketPath);
    this.sock.on('connect', function(){
      worker.start();
    });
  } else {
    this.port = port;
    if ('function' == typeof host) callback = host, host = null;
    this.host = host;
    this.callback = callback;
    if (this.isChild) {
      this.acceptFd();
    } else {
      this.fd = this.createSocket();
      this.start();
    }
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
 * Create listening socket.
 *
 * @return {Number} fd
 * @api public
 */

Master.prototype.createSocket = function(){
  if (this.host) {
    return binding.socket('tcp' + net.isIP(this.host));
  } else if ('string' == typeof this.port) {
    return binding.socket('unix');
  } else if (this.port) {
    return binding.socket('tcp4');
  }
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
  this._server.listen(this.socketPath, function(){
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
 * Graceful shutdown, wait for all workers
 * to reply before exiting.
 *
 * @api public
 */

Master.prototype.close = function(){
  this.state = 'graceful shutdown';
  this.emit('closing');
  this.kill('SIGQUIT');
  this.pendingDeaths = this.children.length;
};

/**
 * Hard shutdwn, immediately kill all workers.
 *
 * @api public
 */

Master.prototype.destroy = function(){
  this.state = 'hard shutdown';
  this.emit('closing');
  this.kill('SIGKILL');
  this._destroy();
};


/**
 * Restart all workers, by sending __SIGQUIT__
 * or `sig` to them, enabling master to re-spawn.
 *
 * @param {String} sig
 * @return {ChildProcess} replacement master process
 * @api public
 */

Master.prototype.restart = function(sig){
  var data = {}
    , proc = this.spawnMaster();

// pass object to plugins, allowing them
  // to patch it, and utilize the data in
  // the new Master
  this.emit('restarting', data);
  proc.sock.write(JSON.stringify({
    method: 'connectMaster'
  }), 'ascii', this.fd);

  // TODO: refactor
  this.on('close', function(){
    proc.sock.write(JSON.stringify({
        method: 'retireMaster'
      , args: [data]
    }), 'ascii');
  });

  return proc;
};

/**
 * Spawn a new master process.
 *
 * @return {ChildProcess}
 * @api private
 */

Master.prototype.spawnMaster = function(){
  var fds = binding.socketpair()
    , customFds = [fds[0], 1, 2];

  // spawn new master process
  var proc = spawn(node, this.cmd, {
      customFds: customFds
    , env: {
        CLUSTER_REPLACEMENT_MASTER: 1
      , CLUSTER_PARENT_PID: this.pid
    }
  });
  
  proc.stdin = new net.Socket(fds[0]);

  // unix domain socket for ICP + fd passing
  proc.sock = new net.Socket(fds[1], 'unix');;
  return proc;
};

/**
 * Master replacement connected.
 *
 * @param {Object} data
 * @api private
 */

Master.prototype.connectMaster = function(){
  var self = this;
  this.on('listening', function(){
    process.kill(self.ppid, 'SIGQUIT');
  });
};

/**
 * Original master has died aka 'retired',
 * we now fire the 'restart' event.
 *
 * @param {Object} data
 * @api private
 */

Master.prototype.retireMaster = function(data){
  this.emit('restart', data);
};

/**
 * Accept fd from parent master, then `start()`.
 *
 * @api private
 */

Master.prototype.acceptFd = function(){
  var self = this
    , stdin = new net.Socket(0, 'unix');

  // set fd and start master
  stdin.setEncoding('ascii');
  stdin.on('fd', function(fd){
    self.fd = fd;
    self.start();
  });

  // frame commands from the parent master
  stdin.on('data', this.frame.bind(this));
  stdin.resume();
};

/**
 * Immediate shutdown, used by `Master#close()`
 * and `Master#destroy()` when all workers have shutdown.
 *
 * @api private
 */

Master.prototype._destroy = function(){
  var self = this;
  self._server.on('close', function(){
    if ('string' == typeof self.port) {
      fs.unlink(self.port, function(){
        self.emit('close');
        process.nextTick(process.exit.bind(process));
      });
    } else {
      self.emit('close');
      process.nextTick(process.exit.bind(process));
    }
  }).close();
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
  if (this.starting && !--this.pendingWorkers) {
    this.startListening(!this.isChild);
  }
};

/**
 * Start listening, when `bind` is `true` the socket
 * will be bound, and will start listening for connections.
 *
 * @param {Boolean} bind
 * @api private
 */

Master.prototype.startListening = function(bind){
  var self = this;

  // remove unix domain socket 
  if ('string' == typeof this.port && bind) {
    fs.unlink(this.port, function(err){
      if (ENOENT != err.errno) throw err;
      listen();
    });
  } else {
    listen();
  }

  // bind / listen
  function listen() {
    if (bind) {
      binding.bind(self.fd, self.port, self.host);
      binding.listen(self.fd, self.options.backlog);
    }
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
    case 'hard shutdown': break;
    case 'graceful shutdown': --this.pendingDeaths || this._destroy(); break;
    default: this.spawnWorker(worker.id);
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