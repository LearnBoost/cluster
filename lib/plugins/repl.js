
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

module.exports = function(){
  var args = arguments;
  return function(master){
    master.on('start', function(){
      var connections = 0;

      // TCP or unix-domain socket repl
      var server = net.createServer(function(sock){
        ++connections;
        repl.start('engine> ', sock);
      });

      // Apply all arguments given
      server.listen.apply(server, args);
    });
  }
};