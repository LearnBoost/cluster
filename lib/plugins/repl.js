
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
  return function(master){
    master.on('start', function(){
      // track REPL connections
      var connections = 0;

      // TCP or unix-domain socket repl
      var server = net.createServer(function(sock){
        ++connections;
        var ctx = repl.start('engine> ', sock).context;
        ctx.connections = connections;

        // augment socket to provide some formatting methods
        sock.head = function(str){ this.write('\n  \033[36m' + str + '\033[0m\n'); }
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
  }
};

/**
 * Display commmand help.
 */

exports.help = function(master, sock){
  sock.head('Commands');
  Object.keys(exports).forEach(function(cmd){
    var fn = exports[cmd]
      , params = fn.toString().match(/^function +\((.*?)\)/)[1]
      , params = params.split(/ *, */).slice(2);

    sock.row(
      cmd + '(' + params.join(', ') + ')'
      , fn.description);
  });
  sock.write('\n');
};

exports.help.description = 'Display help information';

/**
 * Display statistics.
 */

exports.stats = function(master, sock){
  // master stats
  if (master.stats) {
    sock.head('Master');
    sock.row('started', master.stats.start.toUTCString());
    sock.row('uptime', diff(new Date, master.stats.start))
    sock.write('\n');
  }
};

exports.stats.description = 'Display server statistics';

/**
 * Format date difference between `a` and `b`.
 *
 * @param {Date} a
 * @param {Date} b
 * @return {String}
 * @api private
 */

function diff(a, b) {
  var diff = a - b
    , second = 1000
    , minute = second * 60
    , hour = minute * 60
    , day = hour * 24;

  if (diff < second) return diff + ' milliseconds';
  if (diff < minute) return (diff / second).toFixed(0) + ' seconds';
  if (diff < hour) return (diff / minute).toFixed(0) + ' minutes';
  if (diff < day) return (diff / hour).toFixed(0) + ' hours';
  return (diff / day).toFixed(1) + ' days';
}