
/*!
 * Engine - logger
 * Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs')
  , Log = require('log');

/**
 * Enable stdout / stderr logs for both the master
 * process, as well as workers.
 *
 * These output to the given `dir`, or `./logs`
 * relative to the server's file.
 *
 * Examples:
 *
 *    // log to ./logs
 *    engine(server)
 *      .use(engine.logger())
 *      .listen(3000);
 *
 *    // log to ./app/logs
 *    engine(server)
 *      .use(engine.logger('./app/logs'))
 *      .listen(3000);
 *
 *    // log to /var/log/node
 *    engine(server)
 *      .use(engine.logger('/var/log/node'))
 *      .listen(3000);
 *
 * @param {String} dir
 * @param {Number} level
 * @return {Function}
 * @api public
 */

module.exports = function(dir, level){
  return function(master){
    dir = master.resolve(dir || 'logs');

    // master log
    var stream = fs.createWriteStream(dir + '/master.log', { flags: 'a' });
    master.log = new Log(level || Log.INFO, stream);

    // master events
    master.on('start', function(){
      master.log.info('master started');
    });

    master.on('closing', function(){
      master.log.warning('shutting down master');
    });

    master.on('close', function(){
      master.log.info('shutdown complete');
    });

    master.on('kill', function(sig){
      master.log.warning('sent kill(' + sig + ') to all workers');
    });

    master.on('worker killed', function(worker){
      master.log.error('worker ' + worker.id + ' died');
    });

    master.on('worker connected', function(worker){
      master.log.debug('worker ' + worker.id + ' connected');
    });

    master.on('repl socket', function(sock){
      var from = sock.remoteAddress
        ? 'from ' + sock.remoteAddress
        : '';
      sock.on('connect', function(){
        master.log.info('repl connection ' + from);
      });
      sock.on('close', function(){
        master.log.info('repl disconnect ' + from);
      });
    });

    // Override fds
    master.customFds = [-1, -1];

    // children
    master.on('worker', function(worker){
      var proc = worker.proc
        , access = dir + '/worker.' + worker.id + '.access.log'
        , error = dir + '/worker.' + worker.id + '.error.log';

      master.log.info('spawned worker ' + worker.id);

      // worker-specific logs
      worker.accessLog = fs.createWriteStream(access, { flags: 'a' });
      worker.errorLog = fs.createWriteStream(error, { flags: 'a' });

      // redirect stdout / stderr
      proc.stdout.pipe(worker.accessLog);
      proc.stderr.pipe(worker.errorLog);
    });

    master.on('worker killed', function(worker){
      worker.accessLog.end();
    });
  }
};