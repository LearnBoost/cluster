
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

    // killing workers
    master.on('kill', function(sig){
      log.warning('kill(' + sig + ')');
    });

    // master shutting down
    master.on('shutdown', function(){
      log.info('master shutting down');
    });

    // worker died
    master.on('worker killed', function(){
      log.warning('worker killed');
    });

    // connection
    master.on('worker connected', function(worker){
      log.info('worker ' + worker.id + ' connected');
    });

    // worker
    master.on('worker', function(worker){
      log.info('worker spawned ' + worker.id);
    });

    // listening
    master.on('listening', function(){
      log.info('listening for connections');
    });

    // broadcasting
    master.on('broadcast', function(cmd, args){
      log.info('broadcast ' + cmd);
    });

    // sending PONG
    master.on('pong', function(worker){
      log.info('sent PONG to ' + worker.id);
    });
  }
};