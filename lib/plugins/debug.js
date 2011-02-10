
/*!
 * Engine - debug
 * Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Logger.
 */

var log = {
  info: function(str){
    console.log('  info \033[90m- %s\033[0m', str);
  },
  warning: function(str){
    console.log('  \033[33mwarning\033[0m \033[90m- %s\033[0m', str);
  },
  error: function(str){
    console.log('  \033[31merror\033[0m \033[90m- %s\033[0m', str);
  }
};

/**
 * Enable verbose debugging output.
 *
 * @return {Function}
 * @api public
 */

module.exports = function(){
  return function(master){

    // start
    master.on('start', function(){
      log.info('master started');
    });

    // closing
    master.on('closing', function(){
      log.info('shutting down');
    });

    // close
    master.on('close', function(){
      log.info('shutdown complete');
    });

    // killing workers
    master.on('kill', function(sig){
      log.warning('kill(' + (sig || 'SIGTERM') + ')');
    });

    // worker died
    master.on('worker killed', function(worker){
      if ('restarting' == master.state) return;
      log.warning('worker ' + worker.id + ' died');
    });

    // worker is waiting on connections to be closed
    master.on('worker waiting', function(worker, connections){
      log.warning('worker ' + worker.id + ' waiting on ' + connections + ' connections');
    });

    // connection
    master.on('worker connected', function(worker){
      log.info('worker ' + worker.id + ' connected');
    });

    // worker
    master.on('worker', function(worker){
      log.info('worker ' + worker.id + ' spawned');
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
      log.info('received PING from ' + worker.id);
    });

    // restart requested
    master.on('restart', function(){
      log.info('restart requested');
    });
  }
};