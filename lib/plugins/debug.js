
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