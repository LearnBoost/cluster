
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
  , repl = require('repl')
  , Table = require('cli-table');

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
 * Display statistics.
 */

exports.stats = function(master, sock){
  // master stats
  if (master.stats) {
    var table = new Table({ head: ['Master', ''] });
    for (var key in master.stats) {
      table.push([key, master.stats[key]]);
    }
    sock.write(table + '\n');
  }
};
