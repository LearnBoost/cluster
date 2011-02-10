
/*!
 * Engine - stats
 * Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var os = require('os')
  , net = require('net')
  , repl = require('repl');

/**
 * Enable REPL with all arguments passed to `net.Server#listen()`.
 *
 * Examples:
 *
 *    engine(server)
 *      .use(engine.stats())
 *      .use(engine.repl('/var/run/engine'))
 *      .listen();
 *
 * In the terminal:
 *
 *    $ sudo telnet /var/run/engine 
 *
 * @return {Function}
 * @api public
 */

exports = module.exports = function(){
  var args = arguments;
  if (!args.length) throw new Error('repl() plugin requires port/host or path');
  return function(master){
    var server;

    // create server
    master.on('start', function(){
      // TCP or unix-domain socket repl
      server = net.createServer(function(sock){
        var ctx = repl.start('engine> ', sock).context;
        master.emit('repl socket', sock);

        // augment socket to provide some formatting methods
        sock.title = function(str){ this.write('\n  \033[36m' + str + '\033[0m\n'); }
        sock.row = function(key, val){ this.write('  \033[90m' + key + ':\033[0m ' + val + '\n'); }

        // merge commands into context
        // executing in context of master
        Object.keys(exports).forEach(function(cmd){
          ctx[cmd] = function(){
            var args = Array.prototype.slice.call(arguments);
            args.unshift(master, sock);
            return exports[cmd].apply(master, args);
          };
        });
      });

      // Apply all arguments given
      server.listen.apply(server, args);
    });

    // close
    master.on('closing', function(){
      server.close();
    });
  }
};

/**
 * Define function `name`, with the given callback
 * `fn(master, sock, ...)` and `description`.
 *
 * @param {String} name
 * @param {Function} fn
 * @param {String} desc
 * @return {Object} exports for chaining
 * @api public
 */

var define = exports.define = function(name, fn, desc){
  (exports[name] = fn).description = desc;
  return exports;
};

/**
 * Display commmand help.
 */

define('help', function(master, sock){
  sock.title('Commands');
  Object.keys(exports).forEach(function(cmd){
    if ('define' == cmd) return;

    var fn = exports[cmd]
      , params = fn.toString().match(/^function +\((.*?)\)/)[1]
      , params = params.split(/ *, */).slice(2);

    sock.row(
      cmd + '(' + params.join(', ') + ')'
      , fn.description);
  });
  sock.write('\n');
}, 'Display help information');

/**
 * Spawn `n` additional workers.
 */

define('spawn', function(master, sock, n){
  n = n || 1;
  sock.write('spawning ' + n + ' worker' + (n > 1 ? 's' : '') + '\n');
  master.spawn(n);
}, 'Spawn one or more additional workers');

/**
 * Output process ids.
 */

define('pids', function(master, sock){
  sock.title('pids');
  sock.row('master', process.pid);
  master.children.forEach(function(worker){
    sock.row('worker #' + worker.id, worker.proc.pid);
  });
  sock.write('\n');
}, 'Output process ids');

/**
 * Kill the given worker by `id` and `signal`.
 */

define('kill', function(master, sock, id, signal){
  var worker = master.children[id];
  if (worker) {
    worker.proc.kill(signal);
    sock.write('sent \033[36m' + (signal || 'SIGTERM') + '\033[0m to worker #' + id + '\n');
  } else {
    sock.write('invalid worker id\n');
  }
}, 'Send signal or SIGTERM to the given worker');

/**
 * Gracefully restart all workers.
 */

define('restart', function(master, sock){
  master.kill('SIGQUIT');
  sock.write('restarting ' + master.children.length + ' workers\n');
}, 'Gracefully restart all workers');