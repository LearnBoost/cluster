
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
      // TCP or unix-domain socket repl
      var server = net.createServer(function(sock){
        var ctx = repl.start('engine> ', sock).context;

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

exports.monitor = function(master, sock){
  master.broadcast('monitor');
};
