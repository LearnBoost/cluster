
/*!
 * Engine - debug
 * Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Log = require('log');

/**
 * Enable verbose debugging output.
 *
 * @return {Function}
 * @api public
 */

module.exports = function(){
  return function(master){
    var log = new Log(Log.DEBUG);

    // start
    master.on('start', function(){
      log.info('master started');
    });

    // close
    master.on('close', function(){
      log.info('master closed');
    });

    // connection
    master.on('connection', function(sock){
      log.info('worker connected');
    });

    // worker
    master.on('worker', function(worker){
      log.info('worker spawned ' + worker.id);
    });

    // listening
    master.on('listening', function(){
      log.info('listening for connections');
    });
  }
};